// filtering thresholds - adjust these later on if necessary
// not interested in making them user definable for now, should Just Work
const MIN_DURATION_RATIO = 0.3;      // partial must last at least 30% of total duration
const MAX_FREQUENCY_CV = 0.1;        // frequency coefficient of variation must be <= 10%
const MIN_AMPLITUDE_RATIO = 0.01;    // peak amplitude must be at least 1% of global max

let selectedFiles = null;

const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertButton');
const statusDiv = document.getElementById('status');
const profileNameInput = document.getElementById('profileName');
const quantiseCheckbox = document.getElementById('quantiseCheckbox');
const oddOnlyCheckbox = document.getElementById('oddOnlyCheckbox');

fileInput.addEventListener('change', handleFileSelect);
convertBtn.addEventListener('click', handleConvert);

function handleFileSelect() {
    selectedFiles = fileInput.files;

    if (selectedFiles.length === 0) {
        convertBtn.disabled = true;
        return;
    }

    for (const file of selectedFiles) {
        if (!file.name.endsWith('.utu')) {
            statusDiv.textContent = 'Please select only .utu files';
            statusDiv.className = 'status error';
            convertBtn.disabled = true;
            return;
        }
    }

    if (selectedFiles.length === 1) {
        const filename = selectedFiles[0].name.replace('.utu', '');
        profileNameInput.value = filename;
        profileNameInput.disabled = false;
    } else {
        profileNameInput.value = '';
        profileNameInput.disabled = true;
    }

    const fileCount = selectedFiles.length;
    statusDiv.textContent = fileCount === 1 ? '1 file selected' : `${fileCount} files selected`;
    statusDiv.className = 'status';
    convertBtn.disabled = false;
}

async function handleConvert() {
    convertBtn.disabled = true;
    statusDiv.textContent = 'Converting...';
    statusDiv.className = 'status';

    try {
        const options = {
            quantise: quantiseCheckbox.checked,
            oddOnly: oddOnlyCheckbox.checked
        };

        if (selectedFiles.length === 1) {
            // converting a single file allows custom profile name
            const file = selectedFiles[0];
            const fileText = await file.text();
            const vutuData = parseVutuFile(fileText);

            options.profileName = profileNameInput.value || file.name.replace('.utu', '');

            const csvContent = convertVutuToZebra(vutuData, options);
            downloadCSV(csvContent, `${options.profileName}.csv`);

            statusDiv.textContent = '.utu successfully converted';
            statusDiv.className = 'status success';
        } else {
            // multiple files will use the .utu filename
            const convertedFiles = [];

            for (const file of selectedFiles) {
                const fileText = await file.text();
                const vutuData = parseVutuFile(fileText);

                const profileName = file.name.replace('.utu', '');
                options.profileName = profileName;

                const csvContent = convertVutuToZebra(vutuData, options);
                convertedFiles.push({
                    filename: `${profileName}.csv`,
                    content: csvContent
                });
            }

            await downloadZip(convertedFiles);

            statusDiv.textContent = `${selectedFiles.length} files successfully converted`;
            statusDiv.className = 'status success';
        }
    } catch (error) {
        statusDiv.textContent = `Error: ${error.message}`;
        statusDiv.className = 'status error';
    } finally {
        convertBtn.disabled = false;
    }
}

function convertVutuToZebra(vutuData, options) {
    // options: { profileName, quantise, oddOnly }

    // calculate max/total duration
    // find loudest amplitude in any partial anywhere
    let totalDuration = 0;
    let globalMaxAmp = 0;
    for (const key in vutuData) {
        if (key.startsWith('p')) {
            const partial = vutuData[key];
            const partialEnd = partial.time[partial.time.length - 1];
            const partialMaxAmp = Math.max(...partial.amp);
            totalDuration = Math.max(totalDuration, partialEnd);
            globalMaxAmp = Math.max(globalMaxAmp, partialMaxAmp);
        }
    }

    // analyse all partials and filter out those we don't need
    const analysedPartials = [];
    for (const key in vutuData) {
        if (key.startsWith('p')) {
            const analysed = analysePartial(vutuData[key], globalMaxAmp, totalDuration);
            if (analysed !== null) {
                analysedPartials.push(analysed);
            }
        }
    }

    // sort partials because they can be out of order
    analysedPartials.sort((a, b) => a.frequency - b.frequency);

    // and possible no partials survived 😔
    if (analysedPartials.length === 0) {
        return generateZebraCSV(analysedPartials, options.profileName);
    }

    const referenceFreq = analysedPartials[0].frequency;
    const loudestAmp = Math.max(...analysedPartials.map(p => p.peakAmp));
    const maxDecayValue = Math.max(...analysedPartials.map(p => p.decayValue));

    const partials = analysedPartials.map(p => {
        return {
            ratio: p.frequency / referenceFreq,
            gainDB: amplitudeToDecibels(p.peakAmp, loudestAmp),
            decay: p.decayValue / maxDecayValue
        };
    });

    // filtering out subharmonics, but maybe add an option to keep them later?
    let filteredPartials = partials.filter(p => p.ratio >= 1.0);

    if (options.quantise) {
        filteredPartials = quantisePartials(filteredPartials);
    }
    if (options.oddOnly) {
        filteredPartials = discardEvenHarmonics(filteredPartials);
    }

    // keep only the 256 loudest partials
    if (filteredPartials.length > 256) {
        filteredPartials.sort((a, b) => b.gainDB - a.gainDB);
        filteredPartials.length = 256;
        filteredPartials.sort((a, b) => a.ratio - b.ratio);
    }

    return generateZebraCSV(filteredPartials, options.profileName);
}

function analysePartial(partial, globalMaxAmp, totalDuration) {
    // filter out short partials
    const partialDuration = partial.time[partial.time.length - 1];
    if (partialDuration < totalDuration * MIN_DURATION_RATIO) {
        return null;
    }

    // filter out wonky partials
    const freqCV = coefficientOfVariation(partial.freq);
    if (freqCV > MAX_FREQUENCY_CV) {
        return null;
    }

    // filter out low amplitude partials
    const maxAmpIndex = indexOfMax(partial.amp);
    const peakAmp = partial.amp[maxAmpIndex];
    if (peakAmp < globalMaxAmp * MIN_AMPLITUDE_RATIO) {
        return null;
    }

    const frequency = partial.freq[maxAmpIndex];
    const timeAtStart = partial.time[0];
    const timeAtEnd = partial.time[partial.time.length - 1];
    const decayValue = (timeAtEnd - timeAtStart) / peakAmp;

    return {
        frequency,
        peakAmp,
        decayValue
    };
}

/* misc helpers */

function parseVutuFile(fileText) {
    try {
        const vutuData = JSON.parse(fileText);
        return vutuData;
    } catch (error) {
        throw new Error(`Failed to parse Vutu file: ${error.message}`);
    }
}

// if all of the partials were filtered out, just generates an empty template
// not sure if it's even possible for that to happen so no need for special logic I think
function generateZebraCSV(partials, profileName) {
    const lines = [];

    lines.push(profileName);
    lines.push('Combined Ratio;GainDB;Decay');
    lines.push('');

    for (const partial of partials) {
        lines.push(`${partial.ratio};${partial.gainDB};${partial.decay}`);
    }

    return lines.join('\n');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

// if we have multiple files, zip em up
async function downloadZip(files) {
    const zip = new JSZip();

    for (const file of files) {
        zip.file(file.filename, file.content);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'converted-profiles.zip';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

// quantise partials to the nearest whole ratio
function quantisePartials(partials) {
    const bestPartials = new Map();

    for (const partial of partials) {
        const roundedRatio = Math.round(partial.ratio);

        // check for duplicate partials, select loudest
        if (!bestPartials.has(roundedRatio) ||
            partial.gainDB > bestPartials.get(roundedRatio).gainDB) {
            bestPartials.set(roundedRatio, { ...partial, ratio: roundedRatio });
        }
    }

    return Array.from(bestPartials.values());
}

function discardEvenHarmonics(partials) {
    return partials.filter(p => !isEvenHarmonic(p.ratio));
}

/* maths helper functions
not sure if anything else needs to be added here */

function standardDeviation(values) {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(val => Math.pow(val - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
}

function indexOfMax(array) {
    let maxIndex = 0;
    let maxValue = array[0];
    for (let i = 1; i < array.length; i++) {
        if (array[i] > maxValue) {
            maxValue = array[i];
            maxIndex = i;
        }
    }
    return maxIndex;
}

function average(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function coefficientOfVariation(values) {
    const avg = average(values);
    const stdDev = standardDeviation(values);
    return stdDev / avg;
}

function amplitudeToDecibels(amp, referenceAmp) {
    return 20 * Math.log10(amp / referenceAmp);
}

function isEvenHarmonic(ratio) {
    const rounded = Math.round(ratio);
    if (rounded % 2 === 0 && rounded > 0) {
        return Math.abs(ratio - rounded) < 0.5;
    }
    return false;
}