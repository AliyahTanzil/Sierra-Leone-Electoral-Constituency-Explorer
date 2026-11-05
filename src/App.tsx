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
import { AlertCircle, CalendarDays, ChartNoAxesColumn, CheckCircle2, ClipboardList, CloudUpload, FileImage, FileSignature, Lightbulb, LoaderCircle, UsersRound } from 'lucide-react';
import AdministrativeMap from './components/AdministrativeMap';
import RrfPollingMap from './components/RrfPollingMap';
import { wardAudit, wardRegister, wardSourceRecords } from './data/wardRegistry';

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
    name: 'Kpanguima',
    region: 'Eastern Region',
    count: 0,
    wards: 0,
    voters: 0,
    dataStatus: 'Gazetted under the 16 September 2026 Extraordinary Gazette · legal and operational implementation review noted · district boundary schedule and ECSL electoral crosswalk pending',
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
    name: 'Bandajuma',
    region: 'Southern Region',
    count: 0,
    wards: 0,
    voters: 0,
    dataStatus: 'Gazetted under the 16 September 2026 Extraordinary Gazette · legal and operational implementation review noted · district boundary schedule and ECSL electoral crosswalk pending',
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
  const [referenceStatus, setReferenceStatus] = useState(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [wardDataOpen, setWardDataOpen] = useState(false);
  const [wardSearch, setWardSearch] = useState('');
  const [wardDistrictFilter, setWardDistrictFilter] = useState('All source districts');
  const [captureUser, setCaptureUser] = useState(null);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const [captureResult, setCaptureResult] = useState(null);
  const [captureLocation, setCaptureLocation] = useState(null);
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
  const positionOptions = captureMeta.electionType === 'Presidential'
    ? ['President', 'Vice President', 'Other / not specified']
    : captureMeta.electionType === 'Parliamentary'
      ? ['Member of Parliament', 'Other / not specified']
      : captureMeta.electionType === 'Local Council'
        ? ['Mayor / Chairperson', 'Councillor', 'Other / not specified']
        : captureMeta.electionType === 'Ward'
          ? ['Ward Councillor', 'Other / not specified']
          : ['President', 'Member of Parliament', 'Mayor / Chairperson', 'Councillor', 'Ward Councillor', 'Other / not specified'];
  const selectedCaptureDistrict = districts.find(d => d.name === captureMeta.district);
  const captureConstituencies = selectedCaptureDistrict
    ? constituencies.filter(c => c.district === selectedCaptureDistrict.name)
    : [];
  const captureWards = captureMeta.constituency
    ? wardRegister.numberedWards.filter(ward => ward.constituencyId === captureMeta.constituency)
    : [];
  const filteredWardRecords = wardSourceRecords.filter(record => {
    const q = wardSearch.trim().toLowerCase();
    return (wardDistrictFilter === 'All source districts' || record.district === wardDistrictFilter) &&
      (!q || record.legacyWardNumber.includes(q) || record.district.toLowerCase().includes(q) || record.description.toLowerCase().includes(q));
  });
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
          <button className="capture-nav-button" onClick={()=>{setWardDataOpen(true);setCaptureOpen(false);setSelected(null);setDistrictDashboard(null);}}> <ClipboardList size={16}/> Ward Register</button>
          <button className="capture-nav-button" onClick={()=>{setCaptureOpen(true);setWardDataOpen(false);setSelected(null);setDistrictDashboard(null);}}> <ScanText size={16}/> RRF Capture</button>
        </div>
      </header>
      <main>
        {captureOpen ? (
          <section className="rrf-page">
            <button className="rrf-back-link" onClick={() => { setCaptureOpen(false); setCaptureResult(null); }}><ArrowLeft size={17}/> Back to Explorer</button>
            <header className="rrf-header">
              <div className="rrf-header-copy">
                <div className="rrf-eyebrow"><span className="rrf-live-dot" /> ELECTION EVIDENCE WORKSPACE</div>
                <h1>RRF Capture <span>&amp; Reconciliation</span></h1>
                <p>Capture a Results and Reconciliation Form, extract its printed information, and preserve the original image for careful human review.</p>
                <div className="rrf-trust-row"><span><LockKeyhole size={15}/> Private account records</span><span><ShieldCheck size={15}/> Source image retained</span><span><CheckCircle2 size={15}/> Human review required</span></div>
              </div>
              <div className="rrf-header-mark"><ScanText size={34}/><span>RRF</span><small>EVIDENCE INTAKE</small></div>
            </header>
            <div className="rrf-steps" aria-label="Capture workflow">
              <div className="rrf-step is-active"><span>01</span><div><b>Form details</b><small>Identify the election</small></div></div>
              <div className="rrf-step-line" />
              <div className="rrf-step"><span>02</span><div><b>Capture document</b><small>Upload a clear image</small></div></div>
              <div className="rrf-step-line" />
              <div className="rrf-step"><span>03</span><div><b>Review extraction</b><small>Check before use</small></div></div>
            </div>
            {!captureUser ? (
              <div className="rrf-signin-card">
                <div className="rrf-signin-icon"><LockKeyhole size={27}/></div>
                <div><div className="rrf-card-kicker">SECURE WORKSPACE</div><h2>Sign in to capture election evidence</h2><p>Access is restricted to authenticated accounts. Uploaded records are stored in a private account partition.</p>{captureError&&<p className="rrf-error">{captureError}</p>}<button className="rrf-primary-button" onClick={async()=>{try{await auth.signInWithRedirect();}catch(e){setCaptureError(e.message||'Sign-in failed.');}}}>Sign in securely <ArrowUpRight size={16}/></button></div>
              </div>
            ) : (
              <div className="rrf-workspace">
                <div className="rrf-main-column">
                  <section className="rrf-card rrf-details-card">
                    <div className="rrf-card-heading">
                      <div className="rrf-heading-icon"><ClipboardList size={21}/></div>
                      <div><div className="rrf-card-kicker">STEP 01 · IDENTIFICATION</div><h2>Document details</h2><p>Enter the context printed on, or associated with, this form.</p></div>
                      <span className="rrf-required-note">* Required where known</span>
                    </div>
                    <div className="rrf-form-section-title"><span>01</span><div><b>Election information</b><small>Set the election and position being recorded.</small></div></div>
                    <div className="rrf-form-grid">
                      <label className="rrf-field"><span>Election type <i>*</i></span><select value={captureMeta.electionType} onChange={e=>setCaptureMeta({...captureMeta,electionType:e.target.value,position:''})}><option value="">Select election type</option><option>Presidential</option><option>Parliamentary</option><option>Local Council</option><option>Ward</option><option>By-election</option><option>Party / internal election</option><option>Other / unknown</option></select></label>
                      <label className="rrf-field"><span>Position contested</span><select value={captureMeta.position} onChange={e=>setCaptureMeta({...captureMeta,position:e.target.value})}><option value="">Select position</option>{positionOptions.map(option=><option key={option} value={option}>{option}</option>)}</select></label>
                      <label className="rrf-field"><span>Election round</span><select value={captureMeta.round} onChange={e=>setCaptureMeta({...captureMeta,round:e.target.value})}><option value="">Select election round</option><option>General election</option><option>First round</option><option>Runoff</option><option>By-election</option><option>Rerun</option><option>Supplementary election</option><option>Other / not specified</option></select></label>
                      <label className="rrf-field"><span>Election date</span><input type="date" value={captureMeta.electionDate} onChange={e=>setCaptureMeta({...captureMeta,electionDate:e.target.value})}/></label>
                    </div>
                    <div className="rrf-form-section-title rrf-location-title"><span>02</span><div><b>Geographic reference</b><small>Use the location stated on the document. Leave unknown details blank.</small></div></div>
                    <div className="rrf-form-grid rrf-location-grid">
                      <label className="rrf-field"><span>District</span><select value={captureMeta.district} onChange={e=>setCaptureMeta({...captureMeta,district:e.target.value,constituency:'',ward:''})}><option value="">Select district</option>{districts.map(item=><option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
                      <label className="rrf-field"><span>Constituency</span><select value={captureMeta.constituency} onChange={e=>setCaptureMeta({...captureMeta,constituency:e.target.value,ward:''})} disabled={!captureMeta.district}><option value="">{captureMeta.district?'Select constituency':'Select district first'}</option>{captureConstituencies.map(item=><option key={item.id} value={item.id}>Constituency {item.id} · sequence placeholder</option>)}</select>{captureMeta.district&&<small className="rrf-field-hint">Official sequence numbers only; verified constituency names are not yet available.</small>}</label>
                      <label className="rrf-field"><span>Ward</span><select value={captureMeta.ward} onChange={e=>setCaptureMeta({...captureMeta,ward:e.target.value})} disabled={!captureMeta.constituency || !wardRegister.complete}><option value="">{!captureMeta.district?'Select district first':!captureMeta.constituency?'Select constituency first':!wardRegister.complete?'Ward register pending validation':'Select ward'}</option>{captureWards.map(item=><option key={item.legacyWardNumber} value={item.newWardNumber || ''}>Ward {item.newWardNumber} · ECSL ref {item.legacyWardNumber}</option>)}</select><small className="rrf-field-hint">{wardRegister.complete?'New constituency-ordered ward numbers are available.':'Sequential ward numbering is locked until all 446 ECSL wards have verified constituency assignments.'}</small></label>
                    </div>
                  </section>
                  <section className="rrf-card rrf-upload-card">
                    <div className="rrf-card-heading">
                      <div className="rrf-heading-icon rrf-blue-icon"><Upload size={21}/></div>
                      <div><div className="rrf-card-kicker">STEP 02 · SOURCE DOCUMENT</div><h2>Upload your RRF</h2><p>Photograph the full page or choose an existing image.</p></div>
                    </div>
                    <label className="rrf-dropzone">
                      <input type="file" accept="image/*" capture="environment" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/')){setCaptureError('Upload an image file (JPG, PNG or WebP).');return;}if(file.size>15*1024*1024){setCaptureError('Maximum source image size is 15 MB.');return;}setCaptureBusy(true);setCaptureError('');setCaptureLocation(null);try{if(!navigator.geolocation)throw new Error('This device or browser does not support GPS location. Enable location services or use a supported mobile browser.');const gps=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(position=>resolve(position),()=>reject(new Error('GPS permission or location fix unavailable. Enable precise location and try taking the RRF photo again.')), {enableHighAccuracy:true,timeout:25000,maximumAge:0}));const location={latitude:gps.coords.latitude,longitude:gps.coords.longitude,accuracyMeters:gps.coords.accuracy,capturedAt:new Date(gps.timestamp||Date.now()).toISOString(),method:'browser_geolocation'};setCaptureLocation(location);const prepared=await image.resizeIfNeeded(file,{maxDimension:1600,maxPixels:2000000,quality:0.86,mimeType:'image/jpeg'});const response=await api.post('/api/rrf/capture',{fileName:file.name,mimeType:prepared.mimeType,imageBase64:prepared.data,metadata:captureMeta,location});setCaptureResult(response.data.record);}catch(err){setCaptureError(err?.message||'Capture failed.');}finally{setCaptureBusy(false);e.target.value='';}}}/>
                      <span className="rrf-upload-icon">{captureBusy?<LoaderCircle size={29} className="rrf-spinning"/>:<CloudUpload size={29}/>}</span>
                      <b>{captureBusy?'Uploading and extracting…':'Choose a file or take a photo'}</b>
                      <span className="rrf-dropzone-description">Photograph the completed RRF at the polling centre. GPS will be captured before upload.</span>
                      <span className="rrf-file-types"><FileImage size={14}/> JPG <i/> PNG <i/> WebP <i/> Maximum 15 MB</span>
                      <span className="rrf-upload-action">{captureBusy?'PLEASE WAIT':'SELECT RRF IMAGE'} <ArrowUpRight size={15}/></span>
                    </label>
                    {captureLocation&&<div className="rrf-gps-confirmation"><MapPin size={17}/><span>GPS captured: {captureLocation.latitude.toFixed(6)}, {captureLocation.longitude.toFixed(6)} · accuracy ±{Math.round(captureLocation.accuracyMeters)} m</span></div>}
                    {captureError&&<div className="rrf-error-banner"><AlertCircle size={17}/><span>{captureError}</span></div>}
                    <div className="rrf-image-tip"><Lightbulb size={17}/><p><b>For the best extraction</b> Keep the whole page inside the frame, use even lighting, avoid shadows, and make sure small figures are readable.</p></div>
                  </section>
                </div>
                <aside className="rrf-side-column">
                  <section className="rrf-card rrf-extraction-card">
                    <div className="rrf-card-kicker">WHAT WE LOOK FOR</div><h2>Universal extraction</h2><p className="rrf-side-intro">The capture process looks for common election fields while accommodating different RRF layouts.</p>
                    <ul className="rrf-extraction-list">
                      <li><span><CalendarDays size={16}/></span><div><b>Election identifiers</b><small>Form title, serial number, election, round and date</small></div></li>
                      <li><span><MapPin size={16}/></span><div><b>Location details</b><small>District, constituency, ward, polling centre and centre code</small></div></li>
                      <li><span><UsersRound size={16}/></span><div><b>Candidate results</b><small>Candidate and party names or IDs, plus votes obtained</small></div></li>
                      <li><span><ChartNoAxesColumn size={16}/></span><div><b>Vote totals</b><small>Valid, invalid and total votes, and other printed totals</small></div></li>
                      <li><span><FileSignature size={16}/></span><div><b>Signatures and notes</b><small>Agents, observers, presiding officer, stamps and handwriting</small></div></li>
                    </ul>
                  </section>
                  <section className="rrf-assurance-card"><div className="rrf-assurance-icon"><ShieldCheck size={22}/></div><div><b>Evidence integrity comes first</b><p>The original image is preserved separately. OCR output is a draft—not verified election data. Unreadable or uncertain values must be checked by a person, never guessed.</p></div></section>
                  <div className="rrf-privacy-note"><LockKeyhole size={16}/><span><b>Private by design</b><small>Capture requires sign-in. Records remain associated with the authenticated account.</small></span></div>
                </aside>
              </div>
            )}
            {captureUser&&<section className="rrf-card rrf-map-card"><div className="rrf-card-heading"><div className="rrf-heading-icon"><MapPin size={21}/></div><div><div className="rrf-card-kicker">FIELD LOCATION DATA</div><h2>Polling-centre GPS map</h2><p>RRF capture locations collected at polling centres. Unverified points are not official centre coordinates.</p></div></div><RrfPollingMap refreshKey={captureResult?.id||''}/></section>}
            {captureResult&&<section className="rrf-card rrf-result-card"><div className="rrf-result-heading"><div className="rrf-heading-icon"><CheckCircle2 size={21}/></div><div><div className="rrf-card-kicker">STEP 03 · REVIEW</div><h2>Extraction result</h2><p>Pending human review · do not treat as verified election data</p></div><span className="rrf-status-pill">{captureResult.status}</span></div><div className="rrf-result-meta"><span>Submission ID</span><code>{captureResult.id}</code></div><pre className="rrf-result-json">{JSON.stringify(captureResult.extractedData,null,2)}</pre><p className="rrf-result-disclaimer"><ShieldCheck size={16}/> The source image is retained separately. Corrections and reviewer approval are the next workflow stage.</p></section>}
          </section>
        ) : wardDataOpen ? (
          <section className="ward-registry-page">
            <button className="back-link" onClick={() => { setWardDataOpen(false); setWardSearch(''); setWardDistrictFilter('All source districts'); }}><ArrowLeft size={17}/> Back to Explorer</button>
            <header className="ward-registry-hero">
              <div className="detail-label">SOURCE DATA WORKSPACE · ECSL</div>
              <h1>National Ward Source Register</h1>
              <p>Published ECSL legacy ward identifiers and descriptions, imported as source records. These records are not yet assigned to constituencies or renumbered.</p>
              <div className="ward-registry-source-link"><a href="https://ec.gov.sl/wards/" target="_blank" rel="noreferrer">Open ECSL ward source <ExternalLink size={14}/></a><span>Retrieved 4 November 2026 · 446 source entries</span></div>
            </header>
            <div className="ward-registry-stats">
              <article><span>Source ward records</span><strong>{wardSourceRecords.length}</strong><small>Unique legacy IDs 001–446</small></article>
              <article><span>Constituency assignments</span><strong>0 / 446</strong><small>Not provided by the source page</small></article>
              <article><span>Unresolved records</span><strong>{wardRegister.unresolvedCount}</strong><small>All remain pending review</small></article>
              <article><span>District summary conflict</span><strong>{wardAudit.metadata.wardPageTotal} vs {wardAudit.metadata.constituencyPageDistrictWardTotal}</strong><small>Ward page vs constituency page totals</small></article>
            </div>
            <div className="dataset-audit-note">
              <div className="dataset-audit-heading"><ShieldCheck size={17}/><b>Data integrity status · source imported, crosswalk pending</b></div>
              <p>The app now contains the 446 ECSL ward descriptions as published source records. The ECSL wards page groups them into 446 records, while the ECSL constituencies page district summary totals 442. This discrepancy is preserved for review. No constituency assignment or new ward number has been inferred.</p>
              <div className="dataset-audit-tags"><span>446 source rows loaded</span><span>0 constituency assignments verified</span><span>Sequential numbering locked</span><span>RRF ward selector locked</span></div>
            </div>
            <section className="ward-findings-section">
              <div className="profile-section-title"><div><span>RECONCILIATION AUDIT</span><h2>Issues requiring official clarification</h2></div><span className="data-status status-review">{wardAudit.findings.length} findings</span></div>
              <div className="ward-findings-grid">{wardAudit.findings.map(finding => (
                <article key={finding.id}>
                  <div className="ward-finding-top"><span>{finding.id}</span><b>{finding.severity.toUpperCase()}</b></div>
                  <p>{finding.description}</p>
                  <small>{finding.action}</small>
                </article>
              ))}</div>
            </section>
            <section className="ward-source-list-section">
              <div className="profile-section-title"><div><span>446 SOURCE RECORDS</span><h2>Browse ward descriptions</h2></div><span className="data-status status-source">{filteredWardRecords.length} shown</span></div>
              <div className="ward-registry-controls">
                <label><span>Search ward number, district or description</span><input value={wardSearch} onChange={e=>setWardSearch(e.target.value)} placeholder="e.g. 030, Kenema, Kandu..." /></label>
                <label><span>Published district heading</span><select value={wardDistrictFilter} onChange={e=>setWardDistrictFilter(e.target.value)}><option>All source districts</option>{Array.from(new Set(wardSourceRecords.map(record=>record.district))).sort().map(name=><option key={name}>{name}</option>)}</select></label>
              </div>
              <div className="ward-source-list">
                {filteredWardRecords.map(record => (
                  <article key={record.legacyWardNumber}>
                    <div className="ward-source-record-heading"><b>Ward {record.legacyWardNumber}</b><span>{record.district}</span><small>{record.population === null ? 'Population not parsed' : 'Population ' + record.population.toLocaleString('en-US')}</small></div>
                    <p>{record.description}</p>
                    <div className="ward-source-record-footer"><span>Constituency: pending · New number: not issued</span>{record.legacyWardNumber === '030' && <b className="ward-review-flag">District heading conflict · review</b>}{record.legacyWardNumber === '273' && <b className="ward-review-flag">Population needs source review</b>}<a href={record.sourceReference} target="_blank" rel="noreferrer">ECSL source <ExternalLink size={12}/></a></div>
                  </article>
                ))}
                {filteredWardRecords.length === 0 && <div className="polling-empty"><h3>No matching ward records</h3><p>Change the search term or source district filter.</p></div>}
              </div>
            </section>
            <section className="ward-source-citations">
              <b>Source documents</b>
              {wardAudit.metadata.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} <ExternalLink size={13}/></a>)}
            </section>
          </section>
        ) : districtDashboard ? (
          <section className="district-dashboard-page">
            <button className="back-link" onClick={() => { setDistrictDashboard(null); setSelected(null); }}><ArrowLeft size={17}/> Back to all districts</button>
            <div className="district-dashboard-hero">
              <div className="detail-icon"><Landmark size={27}/></div>
              <div className="detail-label">DISTRICT DASHBOARD · {districtDashboard.region.toUpperCase()}</div>
              <h1>{districtDashboard.name} District</h1>
              <p>District-level administrative workspace. Constituency, ward, voter and polling-centre records are shown here as they become available and verified.</p>
              {districtDashboard.dataStatus && <p className="district-workspace-intro">{districtDashboard.dataStatus}. No constituency or ward numbers have been fabricated.</p>}
            </div>
            <div className="district-dashboard-stats">
              <article><span>Directory constituency entries</span><strong>{districtDashboard.count || "Pending"}</strong><small>{districtDashboard.count ? "Legacy sequence only · post-2026 district allocation unverified" : "Official constituency delimitation and crosswalk pending"}</small></article>
              <article><span>Ward count reference</span><strong>{districtDashboard.wards || "Pending"}</strong><small>{districtDashboard.wards ? "Ward records and boundaries pending import" : "Verified ward register for this new district not yet available"}</small></article>
              <article><span>Historical district voter figure</span><strong>{districtDashboard.voters ? number(districtDashboard.voters) : "Pending"}</strong><small>{districtDashboard.voters ? "District-level historical reference, not current registration" : "Do not infer a voter total from the former parent districts"}</small></article>
              <article><span>Polling centres imported</span><strong>0</strong><small>Historical register import pending</small></article>
            </div>
            <section className="district-workspace-section">
              <div className="profile-section-title"><div><span>01 / DISTRICT GEOGRAPHY</span><h2>District area map</h2></div><span className="data-status status-review">{districtDashboard.count ? "Focused district view" : "Boundary pending"}</span></div>
              <AdministrativeMap initialFeatureName={districtDashboard.name} initialLevel="ADM2" focusMode contextLabel={`${districtDashboard.name} District`} />
            </section>
            <section className="district-workspace-section">
              <div className="profile-section-title"><div><span>02 / CONSTITUENCY DIRECTORY</span><h2>Constituencies in {districtDashboard.name}</h2></div><span className="data-status status-review">{districtDashboard.count} sequence entries</span></div>
              <p className="district-workspace-intro">These are legacy directory sequence entries based on the earlier 132-constituency reference. They are not proof of post-2026 district allocation, verified local constituency names or boundary assignments. The two newly gazetted districts have no constituency entries until ECSL publishes or confirms the electoral crosswalk.</p>
              <div className="district-dashboard-const-grid">{constituencies.filter(c => c.district === districtDashboard.name).map(c => <button key={c.id} type="button" onClick={() => { setSelectedFromDistrict(true); setSelected(c); setDistrictDashboard(null); }}><span className="number-chip">#{c.id}</span><b>Constituency {c.id}</b><small>View constituency information <ArrowUpRight size={13}/></small></button>)}</div>
            </section>
            <section className="district-workspace-section">
              <div className="profile-section-title"><div><span>03 / CONSTITUENCY-ORDERED WARDS</span><h2>Ward numbering register</h2></div><span className="data-status status-review">{wardRegister.complete ? 'Numbering ready' : 'Crosswalk pending'}</span></div>
              <p className="district-workspace-intro">Original ECSL ward numbers are retained as source identifiers. New numbers are assigned in constituency order only after the complete national ward crosswalk has passed validation.</p>
              <div className="district-dashboard-sections">
                <article><span>WARD SOURCE RECORDS</span><h3>{wardRegister.numberedWards.filter(ward => ward.district === districtDashboard.name).length}</h3><b>{wardRegister.complete ? 'Imported and validated' : 'Awaiting source import'}</b><p>Ward descriptions and original ECSL identifiers are preserved.</p></article>
                <article><span>CONSTITUENCY ASSIGNMENTS</span><h3>{wardRegister.unresolvedCount}</h3><b>Unresolved national assignments</b><p>Area-majority matches remain provisional; overlaps and close matches require review.</p></article>
                <article><span>NEW SEQUENTIAL NUMBERS</span><h3>{wardRegister.complete ? '001–446' : 'Not issued'}</h3><b>{wardRegister.complete ? 'Available' : 'Locked for integrity'}</b><p>Partial numbering is not exposed as a completed register.</p></article>
              </div>
              {!wardRegister.complete && <div className="dataset-audit-note"><div className="dataset-audit-heading"><ShieldCheck size={17}/><b>446 ECSL source records imported · constituency cross-reference pending</b></div><p>This district dashboard now reads the original ECSL ward descriptions under their published district headings. The source grouping is not a verified post-2026 electoral crosswalk. Review the Ward Register for the full source descriptions and documented discrepancies. No ward has been assigned or renumbered by guesswork.</p><button className="profile-inline-action" onClick={() => { setWardDataOpen(true); setDistrictDashboard(null); }}>Open full ward source register <ArrowUpRight size={15}/></button></div>}
            </section>
            <div className="district-dashboard-sections">
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
                <article><span>Wards in this constituency</span><strong>{wardRegister.numberedWards.filter(ward => ward.constituencyId === selected.id).length || 'Not available'}</strong><small>{wardRegister.complete ? 'New constituency-ordered ward numbers' : 'Verified ward-to-constituency cross-reference pending.'}</small></article>
                <article><span>Polling centres / turnout</span><strong>Not available</strong><small>Centre assignments and election-specific results are pending validation.</small></article>
              </div>
              <div className="phase2-data-note"><ShieldCheck size={16}/><p><b>Constituency data scope:</b> this dashboard is reserved for constituency-specific information. District voter figures are intentionally excluded to prevent them being mistaken for constituency totals.</p></div>
            </section>
            <section className="profile-data-section map-ready-section">
              <div className="profile-section-title"><div><span>02 / GEOGRAPHY</span><h2>{selected.district} District · Constituency {selected.id}</h2></div><span className="data-status status-review">Focused district view</span></div>
              <AdministrativeMap initialFeatureName={selected.district} initialLevel="ADM2" focusMode contextLabel={`Constituency ${selected.id} · ${selected.district} District`} />
              <div className="phase2-data-note"><ShieldCheck size={16}/><p><b>Electoral geography:</b> District and ADM3 reference polygons are available for exploration. Constituency-specific boundaries and verified polling-centre coordinates have not yet been imported.</p></div>
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
                <div className="profile-section-title"><div><span>GEOGRAPHIC EXPLORER</span><h2>Explore Sierra Leone by area</h2></div><span className="data-status status-review">Interactive boundary map</span></div>
                <AdministrativeMap />

                <div className="dataset-audit-note"><div className="dataset-audit-heading"><ShieldCheck size={17}/><b>2026 administrative change · source and implementation status</b></div><p>The Extraordinary Sierra Leone Gazette, Vol. CLXVII No. 77, dated 16 September 2026, lists the Bandajuma District Establishment Order (S.I. No. 7) and Kpanguima District Establishment Order (S.I. No. 18). Public reporting also records a Lawyers’ Society challenge concerning the wider instruments and required parliamentary/consultation procedures. This directory records the gazetted names; it does not certify that operational implementation or electoral boundary reconciliation is complete. Gazette text and official boundary schedules must be obtained and reviewed before GIS polygons or electoral assignments are approved.</p><div className="dataset-audit-tags"><span>Gazette: 16 Sep 2026</span><span>Legal review: required</span><span>Electoral crosswalk: pending</span></div></div><div className="map-data-status-grid"><div><b>18</b><span>Gazetted district names represented in the directory</span></div><div><b>14</b><span>ADM2 reference polygons in the legacy GIS source</span></div><div><b>Bandajuma + Kpanguima</b><span>Gazetted district entries; precise boundaries pending authoritative schedule</span></div><div><b>Not sourced</b><span>Official post-2026 constituency / polling-centre geometry</span></div></div>
              </section>
              <div className="section-heading">
                <div><div className="eyebrow muted">THE DISTRICT DIRECTORY</div><h2>Choose a district</h2><p>Open a district dashboard to explore its constituency directory, map and data coverage. Constituency and ward figures on the legacy districts remain pre-redistricting references until ECSL confirms the revised electoral crosswalk.</p></div>
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
                        <div><strong>{d.count || "Pending"}</strong><span>constituencies</span></div>
                        <div><strong>{d.wards || "Pending"}</strong><span>wards listed</span></div>
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
