import { useEffect, useMemo, useState } from 'react';
import { api, auth, image } from '@appdeploy/client';
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronDown,
  Compass,
  ExternalLink,
  Filter,
  Landmark,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
  Upload,
  LockKeyhole,
  ScanText,
} from 'lucide-react';

const OFFICIAL = '';
const REGIONS_URL = '';
const districtSeed = [
  {
    name: 'Kailahun',
    region: 'Eastern Region',
    count: 10,
    wards: 29,
    voters: 165753,
  },
  {
    name: 'Kenema',
    region: 'Eastern Region',
    count: 11,
    wards: 22,
    voters: 280142,
  },
  {
    name: 'Kono',
    region: 'Eastern Region',
    count: 9,
    wards: 27,
    voters: 186094,
  },
  {
    name: 'Bombali',
    region: 'Northern Region',
    count: 8,
    wards: 28,
    voters: 187664,
  },
  {
    name: 'Falaba',
    region: 'Northern Region',
    count: 4,
    wards: 21,
    voters: 65761,
  },
  {
    name: 'Koinadugu',
    region: 'Northern Region',
    count: 4,
    wards: 21,
    voters: 84293,
  },
  {
    name: 'Tonkolili',
    region: 'Northern Region',
    count: 10,
    wards: 31,
    voters: 204231,
  },
  {
    name: 'Kambia',
    region: 'North Western Region',
    count: 6,
    wards: 28,
    voters: 155484,
  },
  {
    name: 'Karene',
    region: 'North Western Region',
    count: 5,
    wards: 21,
    voters: 101160,
  },
  {
    name: 'Port Loko',
    region: 'North Western Region',
    count: 10,
    wards: 31,
    voters: 233962,
  },
  {
    name: 'Bo',
    region: 'Southern Region',
    count: 11,
    wards: 42,
    voters: 284347,
  },
  {
    name: 'Bonthe',
    region: 'Southern Region',
    count: 4,
    wards: 21,
    voters: 92182,
  },
  {
    name: 'Moyamba',
    region: 'Southern Region',
    count: 6,
    wards: 20,
    voters: 147041,
  },
  {
    name: 'Pujehun',
    region: 'Southern Region',
    count: 6,
    wards: 11,
    voters: 101251,
  },
  {
    name: 'Western Area Rural',
    region: 'Western Rural',
    count: 8,
    wards: 32,
    voters: 282355,
  },
  {
    name: 'Western Area Urban',
    region: 'Western Urban',
    count: 20,
    wards: 57,
    voters: 606942,
  },
];
let nextNo = 1;
const districts = districtSeed.map(d => {
  const start = nextNo;
  nextNo += d.count;
  return { ...d, start, end: nextNo - 1 };
});
const constituencies = districts.flatMap(d =>
  Array.from({ length: d.count }, (_, i) => ({
    id: String(d.start + i).padStart(3, '0'),
    district: d.name,
    region: d.region,
    districtCount: d.count,
    officialDistrictUrl: OFFICIAL,
    dataNote:
      'Official constituency number sequence; detailed boundary/name data not published in this directory view.',
  }))
);
const regions = [
  'Eastern Region',
  'Northern Region',
  'North Western Region',
  'Southern Region',
  'Western Rural',
  'Western Urban',
];
const number = n => n.toLocaleString('en-US');
function App() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('All regions');
  const [district, setDistrict] = useState('All districts');
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('slee-saved') || '[]');
    } catch {
      return [];
    }
  });
  const [view, setView] = useState('Explore');
  const [selected, setSelected] = useState(null);
  const [districtDashboard, setDistrictDashboard] = useState(null);
  const [selectedFromDistrict, setSelectedFromDistrict] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [mapDistrict, setMapDistrict] = useState('Western Area Urban');
  const [referenceStatus, setReferenceStatus] = useState(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureUser, setCaptureUser] = useState(null);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const [captureResult, setCaptureResult] = useState(null);
  const [captureMeta, setCaptureMeta] = useState({ electionType: 'Parliamentary', position: 'Member of Parliament', round: '', district: '', constituency: '', ward: '', electionDate: '' });
  useEffect(() => { api.get('/api/electoral/reference').then(result => setReferenceStatus(result.data)).catch(() => setReferenceStatus(null)); auth.getUser().then(setCaptureUser).catch(() => setCaptureUser(null)); }, []);
  useEffect(() => {
    try {
      localStorage.setItem('slee-saved', JSON.stringify(saved));
    } catch {}
  }, [saved]);
  const visible = useMemo(
    () =>
      constituencies.filter(c => {
        const d = districts.find(x => x.name === c.district);
        const q = query.trim().toLowerCase();
        return (
          (!q ||
            c.id.includes(q) ||
            c.district.toLowerCase().includes(q) ||
            c.region.toLowerCase().includes(q)) &&
          (region === 'All regions' || c.region === region) &&
          (district === 'All districts' || c.district === district) &&
          (view !== 'Saved' || saved.includes(c.id))
        );
      }),
    [query, region, district, view, saved]
  );
  const activeDistricts = districts.filter(
    d => region === 'All regions' || d.region === region
  );
  const toggleSaved = id =>
    setSaved(old =>
      old.includes(id) ? old.filter(x => x !== id) : [...old, id]
    );
  const clearFilters = () => {
    setQuery('');
    setRegion('All regions');
    setDistrict('All districts');
  };
  const selectedDistrict = selected
    ? districts.find(d => d.name === selected.district)
    : null;
  const formatVoters = n => number(n);
  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={e => {
            e.preventDefault();
            setSelected(null);
            setDistrictDashboard(null);
            setView('Explore');
          }}
          aria-label="Constituency Explorer home"
        >
          <span className="brand-mark">
            <Compass size={22} />
          </span>
          <span>
            <b>Salone</b>
            <small>CONSTITUENCY EXPLORER</small>
          </span>
        </a>
        <div className="top-links">
          <span className="independent"><span /> Independent civic tool</span>
          <span className="independent">App-managed electoral records</span>
          <button className="capture-nav-button" onClick={()=>{setCaptureOpen(true);setSelected(null);setDistrictDashboard(null);}}> <ScanText size={16}/> RRF Capture</button>
        </div>
      </header>
      <main>
        {captureOpen ? (
          <section className="rrf-page">
            <button className="back-link" onClick={() => { setCaptureOpen(false); setCaptureResult(null); }}><ArrowLeft size={17}/> Back to Explorer</button>
            <div className="rrf-hero"><div className="detail-label">PRIMARY ELECTION EVIDENCE INTAKE</div><h1>Results & Reconciliation Form Capture</h1><p>Photograph or upload an RRF. OCR extracts the information while preserving the captured image as the source evidence.</p><span><LockKeyhole size={15}/> Secure sign-in · private account records · human review required</span></div>
            {!captureUser ? <div className="rrf-panel"><LockKeyhole size={25}/><h2>Sign in to capture election evidence</h2><p>Uploads are restricted to authenticated accounts and stored in a private account partition.</p><button className="primary-action" onClick={async()=>{try{await auth.signInWithRedirect();}catch(e){setCaptureError(e.message||'Sign-in failed.');}}}>Sign in securely</button>{captureError&&<p className="rrf-error">{captureError}</p>}</div> : <div className="rrf-layout"><section className="rrf-panel"><h2>1. Document details</h2><div className="rrf-meta-grid"><label>Election type<select value={captureMeta.electionType} onChange={e=>setCaptureMeta({...captureMeta,electionType:e.target.value})}><option>Presidential</option><option>Parliamentary</option><option>Local Council</option><option>Ward</option><option>By-election</option><option>Party / internal election</option><option>Other / unknown</option></select></label><label>Position contested<input value={captureMeta.position} onChange={e=>setCaptureMeta({...captureMeta,position:e.target.value})}/></label><label>Election round<input value={captureMeta.round} onChange={e=>setCaptureMeta({...captureMeta,round:e.target.value})} placeholder="General, runoff, rerun…"/></label><label>District<input value={captureMeta.district} onChange={e=>setCaptureMeta({...captureMeta,district:e.target.value})}/></label><label>Constituency<input value={captureMeta.constituency} onChange={e=>setCaptureMeta({...captureMeta,constituency:e.target.value})}/></label><label>Ward<input value={captureMeta.ward} onChange={e=>setCaptureMeta({...captureMeta,ward:e.target.value})}/></label><label>Election date<input type="date" value={captureMeta.electionDate} onChange={e=>setCaptureMeta({...captureMeta,electionDate:e.target.value})}/></label></div><label className="rrf-upload-zone"><input type="file" accept="image/*" capture="environment" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/')){setCaptureError('Upload an image file (JPG, PNG or WebP).');return;}if(file.size>15*1024*1024){setCaptureError('Maximum source image size is 15 MB.');return;}setCaptureBusy(true);setCaptureError('');try{const prepared=await image.resizeIfNeeded(file,{maxDimension:1600,maxPixels:2000000,quality:0.86,mimeType:'image/jpeg'});const response=await api.post('/api/rrf/capture',{fileName:file.name,mimeType:prepared.mimeType,imageBase64:prepared.data,metadata:captureMeta});setCaptureResult(response.data.record);}catch(err){setCaptureError(err?.message||'Capture failed.');}finally{setCaptureBusy(false);e.target.value='';}}}/><Upload size={27}/><b>{captureBusy?'Uploading and extracting…':'Tap to photograph or upload an RRF image'}</b><small>JPG, PNG or WebP · use a clear, full-page image</small></label>{captureError&&<p className="rrf-error">{captureError}</p>}</section><section className="rrf-panel"><h2>2. Universal extraction fields</h2><ul className="rrf-list"><li>Election, office/position, round, form title, serial number and date</li><li>District, constituency, ward, polling centre and centre code</li><li>Candidate names, party names/IDs, contacts and votes obtained</li><li>Valid votes, invalid votes, total votes and other printed totals</li><li>Agents/observers, party IDs, contact details and signatures</li><li>Presiding officer, stamps, handwritten notes, checkboxes and additional fields</li></ul><p className="rrf-note">Different form layouts are supported. Unknown or unreadable values must remain blank/uncertain rather than being guessed.</p></section></div>}
            {captureResult&&<section className="rrf-panel"><h2>Extraction result · pending human review</h2><p>Submission ID: {captureResult.id}</p><p>Status: <b>{captureResult.status}</b></p><pre className="rrf-result-json">{JSON.stringify(captureResult.extractedData,null,2)}</pre><p className="rrf-note">The source image is retained separately. OCR output is not verified election data. Corrections and reviewer approval are the next workflow stage.</p></section>}
          </section>
        ) : districtDashboard ? (
          <section className="district-dashboard-page">
            <button className="back-link" onClick={() => { setDistrictDashboard(null); setSelected(null); }}><ArrowLeft size={17}/> Back to all districts</button>
            <div className="district-dashboard-hero">
              <div className="detail-icon"><Landmark size={27}/></div>
              <div className="detail-label">DISTRICT DASHBOARD · {districtDashboard.region.toUpperCase()}</div>
              <h1>{districtDashboard.name} District</h1>
              <p>District-level electoral workspace. Constituency, ward and polling-centre records are shown here as they become available and verified.</p>
            </div>
            <div className="district-dashboard-stats">
              <article><span>Directory constituency entries</span><strong>{districtDashboard.count}</strong><small>Sequence entries only · names and boundaries pending</small></article>
              <article><span>Ward count reference</span><strong>{districtDashboard.wards}</strong><small>Ward records and boundaries pending import</small></article>
              <article><span>Historical district voter figure</span><strong>{number(districtDashboard.voters)}</strong><small>District-level historical reference, not current registration</small></article>
              <article><span>Polling centres imported</span><strong>0</strong><small>Historical register import pending</small></article>
            </div>
            <section className="district-workspace-section">
              <div className="profile-section-title"><div><span>01 / DISTRICT GEOGRAPHY</span><h2>District area map</h2></div><span className="data-status status-review">Area locator only</span></div>
              <div className="area-map-card"><div className="area-map-heading"><div><b>{districtDashboard.name}, Sierra Leone</b><small>Place-name map search · not an official boundary</small></div><a href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(districtDashboard.name + ', Sierra Leone')} target="_blank" rel="noreferrer">Open full map <ArrowUpRight size={14}/></a></div><iframe title={districtDashboard.name + ' district map'} src={'https://maps.google.com/maps?q=' + encodeURIComponent(districtDashboard.name + ', Sierra Leone') + '&output=embed'} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/><p>Area locator only. Verified district boundaries, ward polygons, constituency boundaries and polling-centre coordinates have not yet been imported.</p></div>
            </section>
            <section className="district-workspace-section">
              <div className="profile-section-title"><div><span>02 / CONSTITUENCY DIRECTORY</span><h2>Constituencies in {districtDashboard.name}</h2></div><span className="data-status status-review">{districtDashboard.count} sequence entries</span></div>
              <p className="district-workspace-intro">These are directory sequence numbers grouped under this district. They are not verified local constituency names or boundary assignments.</p>
              <div className="district-dashboard-const-grid">{constituencies.filter(c => c.district === districtDashboard.name).map(c => <button key={c.id} type="button" onClick={() => { setSelectedFromDistrict(true); setSelected(c); setDistrictDashboard(null); }}><span className="number-chip">#{c.id}</span><b>Constituency {c.id}</b><small>View constituency information <ArrowUpRight size={13}/></small></button>)}</div>
            </section>
            <div className="district-dashboard-sections">
              <article><span>03 / WARDS</span><h3>Ward directory</h3><b>Import pending</b><p>Ward names, identifiers and geographic boundaries will be added after source validation.</p></article>
              <article><span>04 / POLLING CENTRES</span><h3>Polling-centre register</h3><b>Import pending</b><p>Historical polling-centre records, duplicate checks and district reconciliation are pending.</p></article>
              <article><span>05 / DATA CROSS-REFERENCE</span><h3>Constituency matching</h3><b>Validation pending</b><p>Centre-to-constituency assignments will not be inferred without a reliable cross-reference.</p></article>
            </div>
            <div className="dataset-audit-note"><div className="dataset-audit-heading"><ShieldCheck size={17}/><b>District data status · pending work</b></div><p>Historical polling-centre import, record validation, district-to-constituency cross-reference, ward data and verified GIS boundaries remain pending. RF form design remains deferred.</p></div>
          </section>
        ) : selected ? (
          <section className="detail-page">
            <button className="back-link" onClick={() => { setSelected(null); if (selectedFromDistrict && selectedDistrict) setDistrictDashboard(selectedDistrict); setSelectedFromDistrict(false); }}>
              <ArrowLeft size={17} /> {selectedFromDistrict ? `Back to ${selectedDistrict?.name || 'district'} dashboard` : 'Back to directory'}
            </button>
            <div className="detail-hero">
              <div className="detail-icon">
                <Landmark size={27} />
              </div>
              <div className="detail-label">CONSTITUENCY DASHBOARD</div>
              <h1>Constituency {selected.id}</h1>
              <p className="detail-sub">
                {selected.district} District <span>·</span> {selected.region}
              </p>
              <button
                className={
                  saved.includes(selected.id) ? 'save-btn saved' : 'save-btn'
                }
                onClick={() => toggleSaved(selected.id)}
              >
                {saved.includes(selected.id) ? (
                  <Check size={17} />
                ) : (
                  <Bookmark size={17} />
                )}{' '}
                {saved.includes(selected.id) ? 'Saved' : 'Save constituency'}
              </button>
            </div>
            <nav className="profile-breadcrumbs" aria-label="Breadcrumb">
              <button onClick={() => { setSelected(null); setView('Explore'); }}>Sierra Leone</button>
              <span>›</span><span>{selected.region}</span><span>›</span>
              <button onClick={() => { setSelected(null); setRegion(selected.region); setDistrict(selected.district); setView('Explore'); }}>{selected.district} District</button>
              <span>›</span><strong>Constituency {selected.id}</strong>
            </nav>
            <div className="profile-overview-grid">
              <article className="profile-info-card profile-status-card">
                <div className="profile-card-icon"><ShieldCheck size={20}/></div>
                <div className="profile-card-label">RECORD STATUS</div>
                <h2>Independent directory profile</h2>
                <p>This profile is stored in the app's electoral reference database. Constituency names, boundaries and polling-centre assignments remain pending data validation.</p>
                <span className="data-status status-review"><span/> Reference record · review pending</span>
              </article>
              <article className="profile-info-card">
                <div className="profile-card-icon blue"><Landmark size={20}/></div>
                <div className="profile-card-label">PARENT DISTRICT</div>
                <h2>{selected.district}</h2>
                <p>{selected.region} · Parent administrative area only</p>
                <button className="profile-inline-action" onClick={() => { setSelected(null); setRegion(selected.region); setDistrict(selected.district); setView('Explore'); }}>Browse district entries <ArrowUpRight size={15}/></button>
              </article>
            </div>
            <section className="profile-data-section">
              <div className="profile-section-title"><div><span>01 / ELECTORAL SNAPSHOT</span><h2>Election statistics</h2></div><span className="data-status status-unavailable">Unavailable</span></div>
              <div className="profile-stat-grid">
                <article><span>Registered voters in this constituency</span><strong>Not verified</strong><small>Constituency-specific voter records have not yet been imported and validated.</small></article>
                <article><span>Wards in this constituency</span><strong>Not available</strong><small>A verified ward-to-constituency cross-reference is pending.</small></article>
                <article><span>Polling centres / turnout</span><strong>Not available</strong><small>Centre assignments and election-specific results are pending validation.</small></article>
              </div>
              <div className="phase2-data-note"><ShieldCheck size={16}/><p><b>Constituency data scope:</b> this dashboard is reserved for constituency-specific information. District voter figures are intentionally excluded to prevent them being mistaken for constituency totals.</p></div>
            </section>
            <section className="profile-data-section map-ready-section">
              <div className="profile-section-title"><div><span>02 / GEOGRAPHY</span><h2>Explore the area on a map</h2></div><span className="data-status status-review">Area locator · not boundary map</span></div>
              <div className="area-map-card">
                <div className="area-map-heading"><div><b>{selected.district}, Sierra Leone</b><small>Place-name map search · approximate area locator</small></div><a href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(selected.district + ', Sierra Leone')} target="_blank" rel="noreferrer">Open map <ArrowUpRight size={14}/></a></div>
                <iframe title={'Map search for ' + selected.district} src={'https://maps.google.com/maps?q=' + encodeURIComponent(selected.district + ', Sierra Leone') + '&output=embed'} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                <p>Map search locates the named district area. It does not represent an official district or constituency boundary, polling-centre pin, or verified coordinate.</p>
              </div>
              <div className="map-placeholder"><div className="map-placeholder-icon"><MapPin size={27}/></div><h3>Constituency boundary layer pending</h3><p>Official boundary geometry and verified polling-centre coordinates have not yet been imported. No constituency polygon or centre pin is displayed until validated.</p><span className="map-placeholder-caption">Geospatial data status: pending verification.</span></div>
            </section>
            <section className="profile-data-section polling-section">
              <div className="profile-section-title"><div><span>03 / VOTER GUIDANCE</span><h2>Polling information</h2></div><span className="data-status status-unavailable">Import pending</span></div>
              <div className="polling-empty">
                <div className="polling-empty-icon"><MapPin size={22}/></div>
                <div><h3>Polling-centre dataset pending import</h3><p>Polling-centre records will appear here after the historical register has been imported into our database and validated. Centre records will remain district-level until a reliable constituency cross-reference is established.</p><div className="dataset-audit-tags"><span>2023 register: import pending</span><span>Constituency match: unverified</span></div></div>
              </div>
            </section>
            <section className="profile-data-section source-verification-section">
              <div className="profile-section-title"><div><span>04 / DATA MANAGEMENT</span><h2>Record status & pending work</h2></div><span className="data-status status-source">App-managed</span></div>
              <div className="source-record">
                <div className="source-record-icon"><ShieldCheck size={22}/></div>
                <div className="source-record-copy"><h3>Internal electoral reference record</h3><p>This profile is served from the application's own reference database. Administrative provenance and import history are maintained separately from the agent-facing record.</p><small>Record status: directory sequence stored · detailed boundary and centre matching pending</small></div>
              </div>
              <div className="source-dataset-links"><div><b>Reference data coverage</b><small>District and constituency directory records stored internally. Polling-centre register import and geographic cross-reference are still pending.</small></div></div>
              <div className="dataset-audit-note">
                <div className="dataset-audit-heading"><ShieldCheck size={17}/><b>Next milestone · pending</b></div>
                <p>The complete historical polling-centre register import, record validation and district-to-constituency cross-reference are explicitly pending. RF form design is deferred.</p>
                <div className="dataset-audit-tags"><span>2023 centre register: pending import</span><span>Record validation: pending</span><span>Constituency cross-reference: pending</span><span>Geolocation: pending verification</span><span>Boundary layers: pending</span></div>
              </div>
              <p className="profile-disclaimer">Internal reference data is maintained by the Salone Constituency Explorer project. Historical records must not be treated as current election-day figures without an approved update.</p>
            </section>
            <div className="detail-grid">
              <article className="panel">
                <div className="panel-heading">
                  <MapPin size={18} />
                  <h2>Location</h2>
                </div>
                <dl>
                  <div>
                    <dt>District</dt>
                    <dd>{selected.district}</dd>
                  </div>
                  <div>
                    <dt>Administrative region</dt>
                    <dd>{selected.region}</dd>
                  </div>
                  <div>
                    <dt>Directory number</dt>
                    <dd>{selected.id}</dd>
                  </div>
                  <div>
                    <dt>Constituencies in district</dt>
                    <dd>{selectedDistrict?.count}</dd>
                  </div>
                </dl>
              </article>
              <article className="panel district-explorer-panel">
                <div className="panel-heading">
                  <Compass size={18} />
                  <h2>Explore this district</h2>
                </div>
                <p className="district-explorer-intro">
                  Move around the constituency directory for {selected.district}.
                  Select any number below to open its profile without leaving this app.
                </p>
                <div className="district-profile-stats">
                  <div><span>Constituencies</span><strong>{selectedDistrict?.count}</strong></div>
                  <div><span>Wards in district</span><strong>{selectedDistrict?.wards}</strong></div>
                  <div><span>Directory range</span><strong>{String(selectedDistrict?.start || 0).padStart(3, '0')}–{String(selectedDistrict?.end || 0).padStart(3, '0')}</strong></div>
                </div>
                <div className="district-jump-heading">
                  <span>Constituencies in {selected.district}</span>
                  <small>Tap a number to explore</small>
                </div>
                <div className="district-jump-grid">
                  {constituencies.filter(c => c.district === selected.district).map((c, index) => (
                    <button
                      key={c.id}
                      className={c.id === selected.id ? 'district-jump active' : 'district-jump'}
                      onClick={() => { setSelectedFromDistrict(true); setSelected(c); setDistrictDashboard(null); }}
                      aria-current={c.id === selected.id ? 'page' : undefined}
                      style={{ animationDelay: `${index * 35}ms` }}
                    >
                      {c.id}
                    </button>
                  ))}
                </div>
                <p className="district-explorer-footnote">
                  This is an independent directory view. The number sequence and district grouping
                  are shown separately from verified boundary, polling-centre and voter-register data.
                </p>
              </article>
            </div>
            <div className="notice">
              <ShieldCheck size={17} />
              <p>
                <b>Data transparency</b>
                <br />
                This directory sequence is stored in our internal reference database. This page does not assert a constituency's local name, boundaries, polling centres, or voter total until those records are independently matched and reviewed.
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="eyebrow-dot" /> CIVIC INFORMATION · SIERRA
                  LEONE
                </div>
                <h1>
                  Know your
                  <br />
                  <em>constituency.</em>
                </h1>
                <p>
                  Explore Sierra Leone's parliamentary constituencies by
                  district and region. Find a constituency number, save useful
                  entries, and use our internally maintained electoral reference records.
                </p>
                <div className="hero-stats">
                  <div>
                    <strong>132</strong>
                    <span>Constituencies listed</span>
                  </div>
                  <i />
                  <div>
                    <strong>16</strong>
                    <span>District / area groupings</span>
                  </div>
                </div>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <div className="map-shape">
                  <svg viewBox="0 0 240 240" role="img">
                    <path
                      d="M70 13 92 25 109 22 126 39 143 44 151 63 172 74 164 92 180 111 168 132 172 148 151 161 147 181 128 194 116 216 98 204 88 184 70 178 61 157 43 145 48 126 33 109 45 89 41 71 56 57 56 37Z"
                      fill="#dff8f3"
                      stroke="#ffffff"
                      strokeWidth="3"
                    />
                    <path
                      d="M55 59 95 74 151 63M44 108 91 118 168 132M61 157 109 150 151 161M92 25 91 74 88 184M143 44 127 103 128 194M45 89 109 22M70 178 109 150 164 92M95 74 127 103 180 111"
                      fill="none"
                      stroke="#72c7bb"
                      strokeWidth="1.7"
                    />
                    <circle
                      cx="128"
                      cy="103"
                      r="5"
                      fill="#e3a75b"
                      stroke="white"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div className="floating-tag">
                  <span className="tag-dot" /> Explore by district
                </div>
                <div className="floating-card">
                  <span className="tiny-icon">
                    <MapPin size={16} />
                  </span>
                  <div>
                    <b>Start with a place</b>
                    <small>District · Region · Number</small>
                  </div>
                </div>
              </div>
            </section>
            <section className="directory">
              <section className="profile-data-section area-map-directory">
                <div className="profile-section-title"><div><span>GEOGRAPHIC EXPLORER</span><h2>Explore Sierra Leone by area</h2></div><span className="data-status status-review">Area locator</span></div>
                <div className="area-map-controls"><label htmlFor="area-map-select">Select district / area</label><select id="area-map-select" value={mapDistrict} onChange={e => setMapDistrict(e.target.value)}>{districts.map(d => <option key={d.name} value={d.name}>{d.name} · {d.region}</option>)}</select><a href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapDistrict + ', Sierra Leone')} target="_blank" rel="noreferrer">Open full map <ArrowUpRight size={14}/></a></div>
                <div className="area-map-card"><iframe title={'Map search for ' + mapDistrict} src={'https://maps.google.com/maps?q=' + encodeURIComponent(mapDistrict + ', Sierra Leone') + '&output=embed'} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/><p>Area-level place search only. District/constituency boundaries, wards and polling-centre pins require verified GIS data. Map coverage is not an official boundary dataset.</p></div>
                <div className="map-data-status-grid"><div><b>16</b><span>District / area locators</span></div><div><b>0</b><span>Verified constituency coordinates</span></div><div><b>0</b><span>Verified polling-centre pins</span></div><div><b>Pending</b><span>Boundary geometry import</span></div></div>
              </section>
              <div className="section-heading">
                <div><div className="eyebrow muted">THE DISTRICT DIRECTORY</div><h2>Choose a district</h2><p>Open a district dashboard to explore its constituency directory, map and data coverage.</p></div>
                <div className="result-count"><b>{activeDistricts.filter(d => !query.trim() || d.name.toLowerCase().includes(query.trim().toLowerCase()) || d.region.toLowerCase().includes(query.trim().toLowerCase())).length}</b><span>districts</span></div>
              </div>
              <div className="search-row">
                <label className="searchbox">
                  <Search size={19} />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search district or region…"
                    aria-label="Search districts"
                  />
                  {query && (
                    <button
                      className="clear-search"
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                    >
                      <X size={16} />
                    </button>
                  )}
                </label>
                <button
                  className={'filter-toggle ' + (showFilters ? 'active' : '')}
                  onClick={() => setShowFilters(x => !x)}
                >
                  <SlidersHorizontal size={17} /> Filters{' '}
                  <ChevronDown size={15} />
                </button>
              </div>
              {showFilters && (
                <div className="filters">
                  <label>
                    Region
                    <select
                      value={region}
                      onChange={e => {
                        setRegion(e.target.value);
                        setDistrict('All districts');
                      }}
                    >
                      <option>All regions</option>
                      {regions.map(r => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    District / area
                    <select
                      value={district}
                      onChange={e => setDistrict(e.target.value)}
                    >
                      <option>All districts</option>
                      {activeDistricts.map(d => (
                        <option key={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </label>
                  <button className="reset-filters" onClick={clearFilters}>
                    Reset
                  </button>
                </div>
              )}

              <div className="district-summary-grid" aria-label="District overview">
                {activeDistricts
                  .filter(d => !query.trim() || d.name.toLowerCase().includes(query.trim().toLowerCase()) || d.region.toLowerCase().includes(query.trim().toLowerCase()))
                  .map((d, index) => (
                    <article className="district-panel district-dashboard-card" key={d.name} role="button" tabIndex={0} onClick={() => { setDistrictDashboard(d); setSelected(null); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDistrictDashboard(d); setSelected(null); } }} style={{ animationDelay: `${index * 45}ms` }}>
                      <div className={`district-color-bar district-tone-${index % 3}`} />
                      <div className="district-panel-top">
                        <span className="district-kicker">DISTRICT OVERVIEW</span>
                        <span className="district-region">{d.region}</span>
                      </div>
                      <h3>{d.name}</h3>
                      <div className="district-metrics">
                        <div><strong>{d.count}</strong><span>constituencies</span></div>
                        <div><strong>{d.wards}</strong><span>wards listed</span></div>
                      </div>
                      <div className="district-panel-footer"><span>Open district dashboard</span><span className="district-open-mark"><ArrowUpRight size={17}/></span></div>
                    </article>
                  ))}
              </div>
              <div className="cards-grid" style={{ display: 'none' }}>
                {visible.map(c => (
                  <article className="const-card" key={c.id}>
                    <button
                      className="card-main"
                      onClick={() => setSelected(c)}
                      aria-label={'Open constituency ' + c.id}
                    >
                      <div className="card-top">
                        <span className="number-chip">#{c.id}</span>
                        <span className="region-mini">
                          {c.region.replace(' Region', '')}
                        </span>
                      </div>
                      <h3>Constituency {c.id}</h3>
                      <p>
                        <MapPin size={14} />
                        {c.district} District
                      </p>
                      <div className="card-bottom">
                        <span>
                          View details <ArrowUpRight size={15} />
                        </span>
                        <span className="mini-arrow">
                          <ArrowUpRight size={16} />
                        </span>
                      </div>
                    </button>
                    <button
                      className={
                        'bookmark ' + (saved.includes(c.id) ? 'is-saved' : '')
                      }
                      onClick={() => toggleSaved(c.id)}
                      aria-label={
                        saved.includes(c.id)
                          ? 'Remove saved constituency ' + c.id
                          : 'Save constituency ' + c.id
                      }
                    >
                      {saved.includes(c.id) ? (
                        <Check size={17} />
                      ) : (
                        <Bookmark size={17} />
                      )}
                    </button>
                  </article>
                ))}
              </div>
              {activeDistricts.filter(d => !query.trim() || d.name.toLowerCase().includes(query.trim().toLowerCase()) || d.region.toLowerCase().includes(query.trim().toLowerCase())).length === 0 && (
                <div className="empty-state">
                  <span>
                    <Search size={22} />
                  </span>
                  <h3>No districts found</h3>
                  <p>Try another district or region search.
                  </p>
                  <button onClick={clearFilters}>
                    Clear search and filters
                  </button>
                </div>
              )}
              <div className="source-strip">
                <span className="source-icon"><ShieldCheck size={19} /></span>
                <div><b>Data import and GIS work status</b><p>{referenceStatus?.pending?.join(' · ') || 'Historical polling-centre import, validation, cross-reference and GIS boundary work are pending.'} RF form design remains deferred.</p></div>
              </div>
            </section>
          </>
        )}
      </main>
      <footer>
        <a
          className="footer-brand"
          href="#"
          onClick={e => {
            e.preventDefault();
            setSelected(null);
            setDistrictDashboard(null);
            setView('Explore');
          }}
        >
          Salone Explorer
        </a>
        <span>Independent electoral information platform · App-managed reference data</span>
      </footer>
    </div>
  );
}
export default App;
