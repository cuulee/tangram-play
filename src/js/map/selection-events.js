import _ from 'lodash';
import L from 'leaflet';
import { map } from './map';
import { emptyDOMElement } from '../tools/helpers';

const EMPTY_SELECTION_KIND_LABEL = 'Unknown feature';
const EMPTY_SELECTION_NAME_LABEL = '(unnamed)';

class TangramSelectionHover {
    constructor () {
        this.isDoingStuff = false;

        let el = this.el = document.createElement('div');
        el.className = 'map-selection-preview';
        el.style.display = 'none';

        let headerEl = this._headerEl = document.createElement('div');
        headerEl.className = 'map-selection-header';

        let kindEl = this._kindEl = document.createElement('div');
        kindEl.className = 'map-selection-kind-label';

        let nameEl = this._nameEl = document.createElement('div');
        nameEl.className = 'map-selection-name-label';

        headerEl.appendChild(kindEl);
        headerEl.appendChild(nameEl);

        let propertiesEl = this._propertiesEl = document.createElement('div');
        propertiesEl.className = 'map-selection-properties';
        propertiesEl.style.display = 'none';

        let layersEl = this._layersEl = document.createElement('div');
        layersEl.className = 'map-selection-layers';
        layersEl.style.display = 'none';

        let closeEl = this._closeEl = document.createElement('div');
        closeEl.className = 'map-selection-close';
        closeEl.textContent = '×';
        closeEl.style.display = 'none';
        closeEl.addEventListener('click', event => {
            this.hide();
        });

        el.appendChild(headerEl);
        el.appendChild(propertiesEl);
        el.appendChild(layersEl);
        el.appendChild(closeEl);

        document.getElementById('map-container').appendChild(el);
    }

    showAt (x = 0, y = 0) {
        // Guarantee that positioning and sizing calculations occur
        // after DOM content has been placed
        this.el.style.display = 'block';
        this.el.style.position = 'absolute';

        const rect = this.el.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        this.el.style.left = (x - width / 2) + 'px';
        // TODO: don't hardcode magic number
        this.el.style.top = (y - height - 24) + 'px';
    }

    resetPosition () {
        this.el.style.display = null; // Ensures that the absolute positioning from hovers is gone
        this.el.style.position = null;
        this.el.style.left = null;
        this.el.style.top = null;
    }

    hide () {
        this.el.style.display = 'none';
        this._closeEl.style.display = 'none';
        this.isDoingStuff = false;
        this.hideProperties();
        this.hideLayers();
    }

    setLabel (properties) {
        this.kind = this.determineKindValue(properties);
        this.name = this.determineFeatureName(properties);
    }

    determineKindValue (properties) {
        // Kind is usually present on properties
        if (properties.kind) {
            return properties.kind;
        }
        // Sometimes there's no kind value but a key-value of "land: 'base'" (are there other values?)
        else if (properties.land) {
            return 'land';
        }
    }

    set kind (text) {
        if (typeof text === 'string') {
            text = text.replace(/_/g, ' ');
            text = _.capitalize(text);
        }
        else {
            text = EMPTY_SELECTION_KIND_LABEL;
        }

        this._kindEl.textContent = text;
    }

    get kind () {
        let text = this._kindEl.textContent;
        return text !== EMPTY_SELECTION_KIND_LABEL ? text : null;
    }

    determineFeatureName (properties) {
        if (properties.name) {
            return properties.name;
        }
        else if (properties['route_name']) {
            return properties['route_name'];
        }
        else if (properties.land) {
            return properties.land;
        }
        else if (properties['addr_housenumber'] && properties['addr_street']) {
            return `${properties['addr_housenumber']} ${properties['addr_street']}`;
        }
    }

    set name (text) {
        if (!text) {
            text = EMPTY_SELECTION_NAME_LABEL;
            this._nameEl.classList.add('map-selection-name-label-blank');
        }
        else {
            this._nameEl.classList.remove('map-selection-name-label-blank');
        }
        this._nameEl.textContent = text;
    }

    get name () {
        let text = this._nameEl.textContent;
        return text !== EMPTY_SELECTION_NAME_LABEL ? text : null;
    }

    showProperties (properties) {
        emptyDOMElement(this._propertiesEl);

        // Add section label
        const labelEl = document.createElement('div');
        labelEl.className = 'map-selection-label';
        labelEl.textContent = 'Properties';

        this._propertiesEl.appendChild(labelEl);

        // Create table element
        const tableWrapperEl = document.createElement('div');
        const tableEl = document.createElement('table');
        const tbodyEl = document.createElement('tbody');

        tableWrapperEl.className = 'map-selection-properties-table-wrapper';
        tableEl.className = 'map-selection-properties-table';
        tableEl.appendChild(tbodyEl);

        // Alphabetize key-value pairs
        let sorted = [];
        Object.keys(properties)
            .sort()
            .forEach(function (v, i) {
                sorted.push([v, properties[v]]);
            });

        for (let x in sorted) {
            const key = sorted[x][0];
            const value = sorted[x][1];

            const tr = document.createElement('tr');
            const tdKey = document.createElement('td');
            const tdValue = document.createElement('td');
            tdKey.textContent = key;
            tdValue.textContent = value;
            tr.appendChild(tdKey);
            tr.appendChild(tdValue);

            tbodyEl.appendChild(tr);
        }

        tableWrapperEl.appendChild(tableEl);
        this._propertiesEl.appendChild(tableWrapperEl);

        this._propertiesEl.style.display = 'block';
        // Resets scroll position (we don't want it to remember scroll position of the previous set of properties)
        this._propertiesEl.scrollTop = 0;

        this._closeEl.style.display = 'block';
    }

    hideProperties () {
        emptyDOMElement(this._propertiesEl);
        this._propertiesEl.style.display = 'none';
    }

    showLayers (layers) {
        emptyDOMElement(this._layersEl);

        if (!layers || layers.length === 0) {
            return;
        }

        // Add section label
        const labelEl = document.createElement('div');
        labelEl.className = 'map-selection-label';
        labelEl.textContent = 'Layers';

        this._layersEl.appendChild(labelEl);

        // Add layer container
        const layerContainerEl = document.createElement('div');
        layerContainerEl.className = 'map-selection-layers-container';
        this._layersEl.appendChild(layerContainerEl);

        // Create list of layers
        layers.forEach(item => {
            let layerEl = document.createElement('div');
            layerEl.className = 'map-selection-layer-item';
            layerEl.textContent = item;

            // YAML-Tangram addressing uses forward-slashes ('/') to
            // delimit nested key names, rather than the colons (':')
            // returned as layer addresses by Tangram
            let yamlTangramAddress = '/layers/' + item.replace(/:/g, '/');

            layerEl.addEventListener('click', event => {
                console.log(yamlTangramAddress);
            });

            layerContainerEl.appendChild(layerEl);
        });

        this._layersEl.style.display = 'block';
    }

    hideLayers () {
        emptyDOMElement(this._layersEl);
        this._layersEl.style.display = 'none';
    }
}

const selectionEl = new TangramSelectionHover();

export function handleSelectionHoverEvent (selection) {
    if (selectionEl.isDoingStuff) {
        return;
    }

    // The .feature property does not always exist.
    // For instance, when the map is being dragged, there is no
    // feature being picked. So, make sure it is present.
    if (!selection.feature) {
        selectionEl.hide();
        return;
    }

    selectionEl.setLabel(selection.feature.properties);
    selectionEl.showAt(selection.pixel.x, selection.pixel.y);
}

export function handleSelectionClickEvent (selection) {
    if (!selection.feature || selectionEl.isDoingStuff === true) {
        selectionEl.hide();
        return;
    }

    selectionEl.resetPosition();
    selectionEl.isDoingStuff = true;
    selectionEl.setLabel(selection.feature.properties);
    selectionEl.showProperties(selection.feature.properties);
    selectionEl.showLayers(selection.feature.layers);

    // Create a clone of the selection element to add to Leaflet's popup
    // We probably don't want to do this forever because it is a brittle source of bugs
    // and confusion about how this works
    const popupEl = selectionEl.el.cloneNode(true);

    const popup = L.popup({
            closeButton: false,
            autoPanPadding: [20, 70], // 20 + map toolbar height
            offset: [0, -6],
            className: 'map-selection-popup'
        })
        .setLatLng({ lat: selection.leaflet_event.latlng.lat, lng: selection.leaflet_event.latlng.lng })
        .setContent(popupEl)
        .openOn(map);

    popupEl.querySelector('.map-selection-close').addEventListener('click', event => {
        map.closePopup(popup);
    });

    popup._container.style.transform = 'translateZ(100px)';

    map.on('popupclose', event => {
        if (event.popup === popup) {
            event.popup._container.style.transform = null;
            selectionEl.isDoingStuff = false;
            selectionEl.hide(); // Reset
        }
    });

    // selectionEl.showAt(selection.pixel.x, selection.pixel.y);
}
