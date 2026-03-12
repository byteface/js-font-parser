
    import { FontParser } from '../dist/data/FontParser.js';
    import { getFontList } from './shared/font-catalog.js';
    import { createFontDrawer, createFontLoader, getSelectedFont } from './shared/font-ui.js';

    const fonts = getFontList('metadata');
    const loadFontByUrl = createFontLoader((url) => FontParser.load(url));

    const nameIdLabels = {
        0: 'Copyright',
        1: 'Font Family',
        2: 'Font Subfamily',
        3: 'Unique Subfamily',
        4: 'Full Name',
        5: 'Version',
        6: 'PostScript Name',
        7: 'Trademark',
        8: 'Manufacturer',
        9: 'Designer',
        10: 'Description',
        11: 'Vendor URL',
        12: 'Designer URL',
        13: 'License Description',
        14: 'License URL',
        16: 'Typographic Family',
        17: 'Typographic Subfamily'
    };

    const fontDrawerMount = document.getElementById('fontDrawerMount');
    const select = document.getElementById('fontSelect');
    const output = document.getElementById('output');

    createFontDrawer({
        mount: fontDrawerMount,
        select,
        fonts,
        allowUrl: true,
        title: 'Font'
    });

    async function loadSelectedFont() {
        const selected = getSelectedFont(select, fonts);
        const font = await loadFontByUrl(selected.url);
        const records = font.getAllNameRecords();
        renderRecords(records, font);
    }

    output.innerHTML = 'Loading...';
    select.addEventListener('change', async () => {
        try {
            await loadSelectedFont();
        } catch (err) {
            output.textContent = `Failed to load font: ${err}`;
        }
    });
    loadSelectedFont().catch((err) => {
        output.textContent = `Failed to load font: ${err}`;
    });

    function renderRecords(records, font) {
        if (!records.length) {
            output.textContent = 'No name records found.';
            return;
        }

        const nameInfo = typeof font.getNameInfo === 'function' ? font.getNameInfo() : null;
        const os2Info = typeof font.getOs2Info === 'function' ? font.getOs2Info() : null;
        const postInfo = typeof font.getPostInfo === 'function' ? font.getPostInfo() : null;

        const summary = document.createElement('div');
        summary.style.marginBottom = '12px';
        summary.style.color = '#444';
        const chunks = [];
        if (nameInfo) {
            chunks.push(`<strong>Name</strong>: ${nameInfo.fullName || nameInfo.family || 'Unknown'}`);
            if (nameInfo.postScriptName) chunks.push(`PostScript: ${nameInfo.postScriptName}`);
            if (nameInfo.version) chunks.push(`Version: ${nameInfo.version}`);
        }
        if (os2Info) {
            chunks.push(`<strong>OS/2</strong>: weight ${os2Info.weightClass}, width ${os2Info.widthClass}, vendor ${os2Info.vendorId || '?'}`);
            chunks.push(`Typo asc/desc/lineGap: ${os2Info.typoAscender}/${os2Info.typoDescender}/${os2Info.typoLineGap}`);
            chunks.push(`Win ascent/descent: ${os2Info.winAscent}/${os2Info.winDescent}`);
        }
        if (postInfo) {
            chunks.push(`<strong>Post</strong>: italicAngle ${postInfo.italicAngle.toFixed(2)}, underline ${postInfo.underlinePosition}/${postInfo.underlineThickness}`);
        }
        summary.innerHTML = chunks.join(' | ');

        const rows = records
            .filter(r => r.record && r.record.trim().length > 0)
            .map(r => ({
                nameId: r.nameId,
                label: nameIdLabels[r.nameId] || `Name ID ${r.nameId}`,
                value: r.record
            }));

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        thead.innerHTML = '<tr><th>Name ID</th><th>Label</th><th>Value</th></tr>';
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        rows.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${r.nameId}</td><td>${r.label}</td><td>${r.value}</td>`;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        output.innerHTML = '';
        output.appendChild(summary);
        output.appendChild(table);
    }
</script>
<script type="module" src="../tools/shared/main-nav.js">