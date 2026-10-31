import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type LocationItem = {
  id: string;
  submissionId: string;
  ownerUserId: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: string;
  verificationStatus: string;
  pollingCentre?: string | null;
  pollingCentreCode?: string | null;
  district?: string | null;
  constituency?: string | null;
  ward?: string | null;
};
export default function RrfPollingMap({ refreshKey }: { refreshKey: string }) {
  const element = useRef<HTMLDivElement|null>(null);
  const mapRef = useRef<L.Map|null>(null);
  const markersRef = useRef<L.LayerGroup|null>(null);
  const [items,setItems] = useState<LocationItem[]>([]);
  const [visibility,setVisibility] = useState('agent_own_submissions');
  const [error,setError] = useState('');
  useEffect(()=>{ let active=true; fetchLocations(); async function fetchLocations(){ try { const {api}=await import('@appdeploy/client'); const response=await api.get('/api/rrf/map'); if(!active)return; setItems(response.data.items||[]); setVisibility(response.data.visibility||'agent_own_submissions'); setError(''); } catch(e){ if(active)setError(e?.message||'Unable to load GPS points.'); } } return ()=>{active=false;}; },[refreshKey]);
  useEffect(()=>{
    if(!element.current || mapRef.current)return;
    const map=L.map(element.current,{scrollWheelZoom:false}).setView([8.45,-11.8],7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
    const group=L.layerGroup().addTo(map); mapRef.current=map; markersRef.current=group;
    return ()=>{map.remove();mapRef.current=null;markersRef.current=null;};
  },[]);
  useEffect(()=>{
    const map=mapRef.current,group=markersRef.current;if(!map||!group)return;
    group.clearLayers();
    items.forEach(item=>{
      if(!Number.isFinite(item.latitude)||!Number.isFinite(item.longitude))return;
      const marker=L.marker([item.latitude,item.longitude]).addTo(group);
      const title=item.pollingCentre||'Polling centre pending identification';
      const status=item.verificationStatus==='verified'?'Verified centre':item.verificationStatus==='low_accuracy_review_required'?'Low GPS accuracy · review':'Pending verification';
      marker.bindPopup('<strong>'+title.replace(/[&<>"]/g,'')+'</strong><br/>'+[item.district,item.constituency?'Constituency '+item.constituency:null,item.ward?'Ward '+item.ward:null].filter(Boolean).join(' · ').replace(/[&<>"]/g,'')+'<br/>GPS accuracy: ±'+Math.round(item.accuracyMeters)+' m<br/>'+status+'<br/>'+new Date(item.capturedAt).toLocaleString());
    });
    if(items.length){const bounds=L.latLngBounds(items.filter(x=>Number.isFinite(x.latitude)&&Number.isFinite(x.longitude)).map(x=>[x.latitude,x.longitude] as [number,number]));if(bounds.isValid())map.fitBounds(bounds,{padding:[28,28],maxZoom:14});}
  },[items]);
  return <div className="rrf-polling-map-wrap"><div className="rrf-map-meta"><b>{items.length} GPS capture point{items.length===1?'':'s'}</b><span>{visibility==='supervisor_all_agents'?'Supervisor view · all agents':'Agent view · your submissions'}</span></div><div ref={element} className="rrf-polling-map"/>{error&&<p className="rrf-error">{error}</p>}<p className="rrf-map-note">Pins represent the phone's GPS position when the RRF was submitted. They become official polling-centre coordinates only after human verification. OpenStreetMap © contributors.</p></div>;
}
