import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './AdministrativeMap.css';

type BoundaryProperties = { shapeName?: string; shapeID?: string; shapeType?: string };
type BoundaryCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, BoundaryProperties>;
type Props = { initialFeatureName?: string; initialLevel?: 'ADM2' | 'ADM3'; focusMode?: boolean; contextLabel?: string };

const ADM2_PATH = 'releaseData/gbOpen/SLE/ADM2/geoBoundaries-SLE-ADM2.geojson';
const ADM3_PATH = 'releaseData/gbOpen/SLE/ADM3/geoBoundaries-SLE-ADM3.geojson';

// Git LFS-backed GeoJSON must be requested through GitHub's /raw/ route.
 // raw.githubusercontent.com can return the small Git LFS pointer text instead of the file.
const boundaryUrls = (path: string) => [
  'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/' + path,
  'https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/' + path,
];

const districtStyle: L.PathOptions = { color: '#315a78', weight: 1.8, opacity: 0.9, fillColor: '#8eb4c9', fillOpacity: 0.08 };
const localAreaStyle: L.PathOptions = { color: '#168c84', weight: 1, opacity: 0.78, fillColor: '#63c5b6', fillOpacity: 0.08 };

export default function AdministrativeMap({ initialFeatureName, initialLevel = 'ADM2', focusMode = false, contextLabel }: Props) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const districtLayerRef = useRef<L.GeoJSON | null>(null);
  const localAreaLayerRef = useRef<L.GeoJSON | null>(null);
  const [districtNames, setDistrictNames] = useState<string[]>([]);
  const [localAreaNames, setLocalAreaNames] = useState<string[]>([]);
  const [selectedValue, setSelectedValue] = useState(initialFeatureName ? initialLevel + ':' + initialFeatureName : 'ALL');
  const [search, setSearch] = useState('');
  const [showDistricts, setShowDistricts] = useState(true);
  const [showLocalAreas, setShowLocalAreas] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);

  const selectedParts = selectedValue.split(':');
  const selectedLevel = selectedParts[0];
  const selectedName = selectedParts.slice(1).join(':');
  const filteredDistricts = useMemo(() => districtNames.filter(name => name.toLowerCase().includes(search.toLowerCase())), [districtNames, search]);
  const filteredLocalAreas = useMemo(() => localAreaNames.filter(name => name.toLowerCase().includes(search.toLowerCase())), [localAreaNames, search]);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;
    let cancelled = false;
    const map = L.map(mapElement.current, { zoomControl: true, scrollWheelZoom: false, preferCanvas: true });
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const loadGeoJson = async (urls: string[], label: string): Promise<BoundaryCollection> => {
      const failures: string[] = [];
      for (const url of urls) {
        try {
          const response = await fetch(url, {
            headers: { Accept: 'application/geo+json, application/json, */*' },
            cache: 'force-cache',
          });
          const body = await response.text();
          if (!response.ok) {
            failures.push(new URL(url).hostname + ': HTTP ' + response.status);
            continue;
          }
          let parsed: unknown;
          try {
            parsed = JSON.parse(body);
          } catch {
            const preview = body.replace(/\\s+/g, ' ').slice(0, 110);
            const detail = body.includes('git-lfs.github.com/spec/v1')
              ? 'Git LFS pointer returned instead of the GeoJSON payload'
              : 'non-JSON response (' + preview + ')';
            failures.push(new URL(url).hostname + ': ' + detail);
            continue;
          }
          const collection = parsed as BoundaryCollection;
          if (!collection || collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
            failures.push(new URL(url).hostname + ': invalid GeoJSON FeatureCollection');
            continue;
          }
          return collection;
        } catch (error) {
          failures.push(new URL(url).hostname + ': ' + (error instanceof Error ? error.message : 'network/CORS failure'));
        }
      }
      throw new Error(label + ' could not be loaded from any configured mirror. ' + failures.join(' | '));
    };

    Promise.all([
      loadGeoJson(boundaryUrls(ADM2_PATH), 'ADM2 district boundary'),
      loadGeoJson(boundaryUrls(ADM3_PATH), 'ADM3 area boundary'),
    ]).then(([adm2, adm3]) => {
      if (cancelled) return;
      const getName = (feature: GeoJSON.Feature<GeoJSON.Geometry, BoundaryProperties>) => String(feature.properties?.shapeName || 'Unnamed area');
      setDistrictNames(adm2.features.map(getName).sort((a, b) => a.localeCompare(b)));
      setLocalAreaNames(adm3.features.map(getName).sort((a, b) => a.localeCompare(b)));

      const districts = L.geoJSON(adm2, {
        style: districtStyle,
        onEachFeature: (feature, layer) => {
          const name = getName(feature);
          layer.bindTooltip(name + ' District');
          layer.on('click', () => setSelectedValue('ADM2:' + name));
        },
      }).addTo(map);
      const localAreas = L.geoJSON(adm3, {
        style: localAreaStyle,
        onEachFeature: (feature, layer) => {
          const name = getName(feature);
          layer.bindTooltip(name);
          layer.on('click', () => setSelectedValue('ADM3:' + name));
        },
      }).addTo(map);
      districtLayerRef.current = districts;
      localAreaLayerRef.current = localAreas;
      const bounds = districts.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [18, 18] });
      setLoading(false);
    }).catch(error => {
      if (cancelled) return;
      setLoadError(error instanceof Error ? error.message : 'Map data could not be loaded.');
      setLoading(false);
    });

    return () => {
      cancelled = true;
      map.remove();
      mapRef.current = null;
      districtLayerRef.current = null;
      localAreaLayerRef.current = null;
    };
  }, [retry]);

  useEffect(() => {
    const map = mapRef.current;
    const districts = districtLayerRef.current;
    const localAreas = localAreaLayerRef.current;
    if (!map || !districts || !localAreas) return;
    if (showDistricts && !map.hasLayer(districts)) districts.addTo(map);
    if (!showDistricts && map.hasLayer(districts)) map.removeLayer(districts);
    if (showLocalAreas && !map.hasLayer(localAreas)) localAreas.addTo(map);
    if (!showLocalAreas && map.hasLayer(localAreas)) map.removeLayer(localAreas);
  }, [showDistricts, showLocalAreas, loading]);

  useEffect(() => {
    const map = mapRef.current;
    const districts = districtLayerRef.current;
    const localAreas = localAreaLayerRef.current;
    if (!map || !districts || !localAreas || loading) return;
    districts.resetStyle();
    localAreas.resetStyle();
    if (selectedValue === 'ALL') {
      const bounds = districts.getBounds();
      if (bounds.isValid()) {
        map.invalidateSize({ pan: false });
        map.fitBounds(bounds, { padding: [18, 18], maxZoom: 8 });
      }
      return;
    }
    const target = selectedLevel === 'ADM2' ? districts : localAreas;
    const bounds = L.latLngBounds([]);
    target.eachLayer(layer => {
      const path = layer as L.Path & { feature?: GeoJSON.Feature<GeoJSON.Geometry, BoundaryProperties>; getBounds?: () => L.LatLngBounds };
      if (path.feature?.properties?.shapeName !== selectedName) return;
      path.setStyle(selectedLevel === 'ADM2'
        ? { color: '#d97706', weight: 4, opacity: 1, fillColor: '#f6bd60', fillOpacity: 0.16 }
        : { color: '#d97706', weight: 3, opacity: 1, fillColor: '#f6bd60', fillOpacity: 0.3 });
      path.bringToFront();
      if (typeof path.getBounds === 'function') bounds.extend(path.getBounds());
    });
    if (bounds.isValid()) {
      map.invalidateSize({ pan: false });
      map.fitBounds(bounds, {
        padding: focusMode && selectedLevel === 'ADM2' ? [16, 16] : [22, 22],
        maxZoom: focusMode && selectedLevel === 'ADM2' ? 12 : 13,
        animate: true,
        duration: 0.65,
      });
    }
  }, [selectedValue, loading, focusMode]);

  return (
    <section className={focusMode ? 'admin-map-panel admin-map-panel--focus' : 'admin-map-panel'} aria-label="Interactive administrative map">
      <div className="admin-map-toolbar">
        <div className="admin-map-search">
          <label htmlFor="admin-map-search">Find a district or ADM3 area</label>
          <input id="admin-map-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search Koya, East III, Kenema…" />
        </div>
        <div className="admin-map-select">
          <label htmlFor="admin-map-feature">Map focus</label>
          <select id="admin-map-feature" value={selectedValue} onChange={event => setSelectedValue(event.target.value)}>
            <option value="ALL">Show all Sierra Leone</option>
            <optgroup label="Districts · ADM2">{filteredDistricts.map(name => <option key={'district-' + name} value={'ADM2:' + name}>{name}</option>)}</optgroup>
            <optgroup label="Local administrative areas · ADM3">{filteredLocalAreas.map(name => <option key={'area-' + name} value={'ADM3:' + name}>{name}</option>)}</optgroup>
          </select>
        </div>
      </div>
      <div className="admin-map-layer-controls">