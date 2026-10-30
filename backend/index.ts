import { router, json, error, db, storage, ai, requireAuth } from '@appdeploy/sdk';

const districts = [
  { id: 'district_kailahun', name: 'Kailahun', region: 'Eastern Region', constituencies: 10, wards: 29, voters2023: 165753 },
  { id: 'district_kenema', name: 'Kenema', region: 'Eastern Region', constituencies: 11, wards: 22, voters2023: 280142 },
  { id: 'district_kono', name: 'Kono', region: 'Eastern Region', constituencies: 9, wards: 27, voters2023: 186094 },
  { id: 'district_bombali', name: 'Bombali', region: 'Northern Region', constituencies: 8, wards: 28, voters2023: 187664 },
  { id: 'district_falaba', name: 'Falaba', region: 'Northern Region', constituencies: 4, wards: 21, voters2023: 65761 },
  { id: 'district_koinadugu', name: 'Koinadugu', region: 'Northern Region', constituencies: 4, wards: 21, voters2023: 84293 },
  { id: 'district_tonkolili', name: 'Tonkolili', region: 'Northern Region', constituencies: 10, wards: 31, voters2023: 204231 },
  { id: 'district_kambia', name: 'Kambia', region: 'North Western Region', constituencies: 6, wards: 28, voters2023: 155484 },
  { id: 'district_karene', name: 'Karene', region: 'North Western Region', constituencies: 5, wards: 21, voters2023: 101160 },
  { id: 'district_port_loko', name: 'Port Loko', region: 'North Western Region', constituencies: 10, wards: 31, voters2023: 233962 },
  { id: 'district_bo', name: 'Bo', region: 'Southern Region', constituencies: 11, wards: 42, voters2023: 284347 },
  { id: 'district_bonthe', name: 'Bonthe', region: 'Southern Region', constituencies: 4, wards: 21, voters2023: 92182 },
  { id: 'district_moyamba', name: 'Moyamba', region: 'Southern Region', constituencies: 6, wards: 20, voters2023: 147041 },
  { id: 'district_pujehun', name: 'Pujehun', region: 'Southern Region', constituencies: 6, wards: 11, voters2023: 101251 },
  { id: 'district_western_rural', name: 'Western Area Rural', region: 'Western Rural', constituencies: 8, wards: 32, voters2023: 282355 },
  { id: 'district_western_urban', name: 'Western Area Urban', region: 'Western Urban', constituencies: 20, wards: 57, voters2023: 606942 }
];
const provenance = {
  sourceOrganization: 'Electoral Commission for Sierra Leone',
  sourcePublication: 'Constituency directory and district-level voter figures',
  dataPeriod: 'Published directory; publication year not specified in profile',
  importedAt: '2026-10-30',
  verificationStatus: 'transcribed_pending_independent_review',
  visibility: 'administrator_only'
};
async function ensureSeed() {
  const existing = await db.list('electoral_districts', { limit: 50 });
  if (existing.items.length === 0) {
    const ids = await db.add('electoral_districts', districts.map(d => ({
      ...d, geolocationStatus: 'area_lookup_available_coordinates_not_yet_verified',
      boundaryStatus: 'pending_official_geometry', provenance
    })));
    if (ids.some(id => !id)) throw new Error('District seed was not fully saved');
  }
  const current = await db.list('electoral_constituencies', { limit: 200 });
  if (current.items.length === 0) {
    let number = 1;
    const rows = districts.flatMap(d => Array.from({ length: d.constituencies }, () => {
      const id = String(number++).padStart(3, '0');
      return { id: 'constituency_' + id, constituencyNumber: id, districtId: d.id,
        district: d.name, region: d.region, recordStatus: 'directory_sequence_only',
        localName: null, boundaryStatus: 'pending', geolocationStatus: 'pending_verified_locality',
        provenance };
    }));
    for (let i = 0; i < rows.length; i += 100) {
      const ids = await db.add('electoral_constituencies', rows.slice(i, i + 100));
      if (ids.some(id => !id)) throw new Error('Constituency seed was not fully saved');
    }
  }
  return {
    districts: (await db.list('electoral_districts', { limit: 50 })).items,
    constituencies: (await db.list('electoral_constituencies', { limit: 200 })).items
  };
}
export const handler = router({
  'GET /api/_healthcheck': [async () => json({ message: 'Success' })],
  'POST /api/rrf/capture': [requireAuth(), async ({ body, user }) => {
    try {
      const input = body as { fileName?: string; mimeType?: string; imageBase64?: string; metadata?: Record<string, unknown> };
      if (!input.imageBase64 || !['image/jpeg','image/png','image/webp'].includes(input.mimeType || '')) return error('Supported image required',400);
      if (input.imageBase64.length > 7500000) return error('Image payload too large',413);
      const safeUser=user!.userId.replace(/[^a-zA-Z0-9]/g,'');
      const id='rrf_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);
      const ext=input.mimeType==='image/png'?'png':input.mimeType==='image/webp'?'webp':'jpg';
      const imagePath=`rrf/${safeUser}/${id}.${ext}`;
      const [stored]=await storage.write([{path:imagePath,content:input.imageBase64,contentType:input.mimeType!}]);
      if(!stored)return error('Source image storage failed',500);
      let extractedData: unknown={}; let rawOcrText=''; let extractionStatus='manual_transcription_required';
      try {
        const ocr=await ai.ocr({images:[{data:input.imageBase64,mimeType:input.mimeType!}],thinkingMode:'DEEP',maxRetries:2,prompt:'Transcribe this election results and reconciliation form faithfully. Extract every printed and handwritten field across any election type or office. Never guess: use null for unreadable or absent values. Include confidence and review flags. Extract election context, position, form title, serial number, date, district, constituency, ward, polling centre/code, candidate rows with name/party/party ID/contact/votes, valid and invalid votes, total votes, agents/observers with signatures, presiding officer, stamps, additional fields, notes and raw transcription.',schema:{type:'object',properties:{election:{type:'object',properties:{electionType:{type:['string','null']},position:{type:['string','null']},round:{type:['string','null']},formTitle:{type:['string','null']},serialNumber:{type:['string','null']},date:{type:['string','null']},district:{type:['string','null']},constituency:{type:['string','null']},ward:{type:['string','null']},pollingCentre:{type:['string','null']},pollingCentreCode:{type:['string','null']}}},candidates:{type:'array',items:{type:'object',properties:{rowNumber:{type:['integer','null']},name:{type:['string','null']},partyName:{type:['string','null']},partyId:{type:['string','null']},contactNumber:{type:['string','null']},votesObtained:{type:['integer','null']},confidence:{type:['number','null']}}}},reconciliation:{type:'object',properties:{validVotes:{type:['integer','null']},invalidVotes:{type:['integer','null']},totalVotesIncludingInvalid:{type:['integer','null']},otherTotals:{type:'array',items:{type:'object',properties:{label:{type:'string'},value:{type:['string','null']}}}}}},agentsObservers:{type:'array',items:{type:'object',properties:{name:{type:['string','null']},partyId:{type:['string','null']},contactNumber:{type:['string','null']},signaturePresent:{type:['boolean','null']}}}},officials:{type:'object',properties:{presidingOfficer:{type:['string','null']},signaturePresent:{type:['boolean','null']},stampText:{type:['string','null']}}},additionalFields:{type:'array',items:{type:'object',properties:{label:{type:'string'},value:{type:['string','null']}}}},reviewFlags:{type:'array',items:{type:'string'}},rawTranscription:{type:['string','null']}},required:['election','candidates','reconciliation','agentsObservers','additionalFields','reviewFlags']}});
        extractedData=ocr.data||{rawTranscription:ocr.text}; rawOcrText=ocr.text||''; extractionStatus='ocr_completed_pending_human_review';
      } catch(ocrErr){console.error('RRF OCR failed; source preserved',ocrErr);}
      const table=`rrf_submissions_${safeUser}`;
      const record={ownerUserId:user!.userId,imagePath,originalFileName:input.fileName||'form-image',mimeType:input.mimeType,metadata:input.metadata||{},extractedData,rawOcrText,extractionStatus,status:'pending_review',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),verification:{verified:false,verifiedBy:null,verifiedAt:null},audit:[{action:'source_uploaded',actorUserId:user!.userId,at:new Date().toISOString()},{action:'ocr_attempted',actorUserId:'system',at:new Date().toISOString(),result:extractionStatus}]};
      const [savedId]=await db.add(table,[{id,...record}]); if(!savedId)return error('Image stored but database record creation failed',500);
      return json({record:{id:savedId,...record}},201);
    }catch(err){console.error('RRF capture error',err);return error('Unable to process RRF capture',500);}
  }],
  'GET /api/rrf': [requireAuth(), async ({ user }) => { try { const table=`rrf_submissions_${user!.userId.replace(/[^a-zA-Z0-9]/g,'')}`; const page=await db.list(table,{limit:50}); return json({items:page.items.map(({imagePath,rawOcrText,...item})=>item)}); } catch(err){console.error('RRF list error',err);return error('Unable to list submissions',500);} }],
  'GET /api/rrf/:id/image': [requireAuth(), async ({params,user})=>{try{const table=`rrf_submissions_${user!.userId.replace(/[^a-zA-Z0-9]/g,'')}`;const [record]=await db.get<{imagePath:string}>(table,[params.id],{consistent:true});if(!record?.imagePath)return error('Source image not found',404);const [signed]=await storage.url([record.imagePath]);return signed?.url?json({url:signed.url}):error('Source image unavailable',404);}catch(err){console.error('RRF image access error',err);return error('Unable to retrieve source image',500);}}],
  'GET /api/electoral/reference': [async () => {
    try {
      const data = await ensureSeed();
      return json({ data, coverage: { districts: data.districts.length,
        constituencies: data.constituencies.length, pollingCentres: 0,
        constituencyPollingCentreMatches: 0, wards: 0,
        verifiedDistrictCoordinates: 0, verifiedConstituencyCoordinates: 0,
        verifiedPollingCentreCoordinates: 0 },
        pending: ['Import and validate historical 2023 polling-centre register',
          'Build verified district-to-constituency cross-reference',
          'Import ward boundaries and names', 'Verify district and locality coordinates',
          'Obtain authoritative constituency and polling-centre coordinates',
          'Import official administrative boundary geometry'],
        note: 'Polling-centre import, validation and constituency cross-reference are pending. No coordinates or boundaries are invented.' });
    } catch (err) {
      console.error('Reference data load failed', err);
      return error('Unable to load electoral reference data', 500);
    }
  }]
});
