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