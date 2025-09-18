document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file');
    const fileNameDisplay = document.getElementById('file-name');
    const messageArea = document.getElementById('message');
    const experimentsGrid = document.getElementById('experiments');
    const downloadButton = document.getElementById('download');

    if (typeof JSZip === 'undefined' || typeof NBTify === 'undefined') {
        showMessage('A required library (JSZip or NBTify) failed to load. Check your internet connection or browser console (F12) for errors.', 'error');
        return;
    }

    let experimentsData = null;
    let currentZip = null;
    let originalLevelDat = null;
    let originalFileName = 'world.mcworld';

    const experimentsJsonUrl = './api/exp-editor/experiments.json';

    fetch(experimentsJsonUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            experimentsData = data;
        })
        .catch(error => {
            showMessage(`Failed to load experiments.json: ${error}. Make sure it's at /api/exp-editor/experiments.json`, 'error');
        });

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name;
            originalFileName = file.name;
            handleFileUpload(file);
        } else {
            fileNameDisplay.textContent = 'No file chosen';
        }
    });

    function showMessage(text, type = 'info') {
        messageArea.textContent = text;
        messageArea.style.color = type === 'error' ? '#ff4d4d' : (type === 'success' ? '#4dff88' : 'var(--text-secondary)');
    }
    
    async function handleFileUpload(file) {
        if (!file.name.toLowerCase().endsWith('.mcworld')) {
            showMessage('Please upload a .mcworld file.', 'error');
            return;
        }

        resetState();
        showMessage('Processing file...', 'info');

        try {
            const buffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(buffer);
            currentZip = zip;

            const levelDatFile = zip.file('level.dat');
            if (!levelDatFile) {
                throw new Error('level.dat not found in the .mcworld file.');
            }

            const levelDatBuffer = await levelDatFile.async('arraybuffer');
            originalLevelDat = levelDatBuffer;

            const parsedNbt = await NBTify.read(levelDatBuffer, { endian: "little" });
            
            renderExperiments(parsedNbt.data);
            showMessage('File loaded successfully! Toggle experiments below.', 'success');

        } catch (error) {
            resetState();
            showMessage(`Error: ${error.message}`, 'error');
        }
    }

    function renderExperiments(levelData) {
        experimentsGrid.innerHTML = '';
        const currentExperiments = levelData.experiments || {};

        if (!experimentsData) {
            showMessage('Experiments data is not available. Cannot render toggles.', 'error');
            return;
        }

        experimentsData.experiments.forEach(exp => {
            const isEnabled = currentExperiments[exp.id]?.valueOf() === 1;

            const wrapper = document.createElement('div');
            wrapper.className = 'experiment-toggle';

            wrapper.innerHTML = `
                <label for="${exp.id}">
                    <span>${exp.title}</span>
                    <span class="switch">
                        <input type="checkbox" id="${exp.id}" data-experiment-id="${exp.id}" ${isEnabled ? 'checked' : ''}>
                        <span class="slider"></span>
                    </span>
                </label>
            `;
            experimentsGrid.appendChild(wrapper);
        });

        experimentsGrid.style.display = 'grid';
        downloadButton.style.display = 'inline-block';
    }
    
    downloadButton.addEventListener('click', async () => {
        if (!originalLevelDat || !currentZip) {
            showMessage('No file data to process. Please upload a file first.', 'error');
            return;
        }

        showMessage('Generating modified world...', 'info');

        try {
            const parsedNbt = await NBTify.read(originalLevelDat, { endian: "little" });
            const levelData = parsedNbt.data;

            if (!levelData.experiments) {
                levelData.experiments = {};
            }

            let enabledCount = 0;
            const experimentCheckboxes = experimentsGrid.querySelectorAll('input[type="checkbox"]');
            experimentCheckboxes.forEach(checkbox => {
                const experimentId = checkbox.dataset.experimentId;
                const isEnabled = checkbox.checked;
                levelData.experiments[experimentId] = new NBTify.Int8(isEnabled ? 1 : 0);
                if (isEnabled) enabledCount++;
            });

            levelData.experiments.experiments_ever_used = new NBTify.Int8(enabledCount > 0 ? 1 : 0);
            levelData.experiments.saved_with_toggled_experiments = new NBTify.Int8(enabledCount > 0 ? 1 : 0);

            const modifiedBuffer = await NBTify.write(parsedNbt, { endian: "little" });

            currentZip.file('level.dat', modifiedBuffer.buffer);
            const newZipBlob = await currentZip.generateAsync({ type: 'blob' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(newZipBlob);
            link.download = originalFileName.replace('.mcworld', '_edited.mcworld');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            showMessage('Modified world downloaded successfully!', 'success');

        } catch (error) {
            showMessage(`Failed to generate file: ${error.message}`, 'error');
        }
    });

    function resetState() {
        experimentsGrid.style.display = 'none';
        downloadButton.style.display = 'none';
        experimentsGrid.innerHTML = '';
        currentZip = null;
        originalLevelDat = null;
    }
});
