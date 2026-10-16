(() => {
  'use strict';
  const $=id=>document.getElementById(id),data=window.SEAT_DATA,core=window.SEAT_CORE;
  if(!data||!core){$('results-title').textContent='Seat data could not be loaded';$('results-description').textContent='Keep the data folder and all site files together, then reload.';return;}
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const format=value=>Number(value).toLocaleString('en-IN');
  const signed=value=>(value>0?'+':value<0?'−':'')+format(Math.abs(value));
  const percent=value=>value===null?'—':(value>0?'+':value<0?'−':'')+Math.abs(value).toFixed(1)+'%';
  const colleges=new Map(data.colleges.map(c=>[c.id,c])),branches=new Map(data.branches.map(b=>[b.id,b]));
  const states=[...new Set(data.colleges.map(c=>c.state))].sort();
  const defaultCollege=data.colleges.find(c=>/osmania/i.test(c.name))||data.colleges[0];
  const defaultBranch=data.branches.find(b=>b.id==='GMED')||data.branches[0];
  const initialComparison=[defaultCollege,data.colleges.find(c=>/gandhi medical college/i.test(c.name)&&c.state===defaultCollege.state),data.colleges.find(c=>/kakatiya medical/i.test(c.name))].filter(Boolean).map(c=>c.id);
  const defaults=()=>({view:'state',state:'all',college:defaultCollege.id,colleges:[...new Set(initialComparison)],branch:defaultBranch.id,branches:[],matrices:data.matrices.slice(),quotas:data.quotas.slice(),includeAdditions:true,change:'all',search:'',sort:'name',direction:'asc'});
  let filters=defaults(),rows=[],rendered=0,scrollFrame=0,toastTimer;
  const batch=100;
  function readHash(){
    const p=new URLSearchParams(location.hash.slice(1)),f=defaults();
    if(['college','compare','state'].includes(p.get('view')))f.view=p.get('view');
    if(['all',...states].includes(p.get('state')))f.state=p.get('state');
    if(colleges.has(p.get('college')))f.college=p.get('college');
    if(branches.has(p.get('branch')))f.branch=p.get('branch');
    for(const [field,map] of [['colleges',colleges],['branches',branches]])if(p.has(field))f[field]=[...new Set(p.get(field).split(','))].filter(id=>map.has(id));
    for(const [field,param,available] of [['matrices','matrix',data.matrices],['quotas','quota',data.quotas]])if(p.has(param)&&!p.getAll(param).includes('all'))f[field]=available.filter(name=>p.getAll(param).includes(name));
    if(p.get('additions')==='0')f.includeAdditions=false;
    if(['all','increased','decreased','new','existing','newcourses','missing'].includes(p.get('change')))f.change=p.get('change');
    if(['name','base','added','seats2025','seats2026','delta','percent'].includes(p.get('sort')))f.sort=p.get('sort');
    if(['asc','desc'].includes(p.get('direction')))f.direction=p.get('direction');
    f.search=(p.get('search')||'').slice(0,300);filters=f;
  }
  function writeHash(){
    const p=new URLSearchParams();
    for(const name of ['view','change','sort','direction'])p.set(name,filters[name]);
    p.set('additions',filters.includeAdditions?'1':'0');
    if(filters.view==='college')p.set('college',filters.college);
    if(filters.view==='compare'){p.set('colleges',filters.colleges.join(','));p.set('branch',filters.branch);}
    if(filters.view==='state'){p.set('state',filters.state);p.set('branches',filters.branches.join(','));}
    for(const [field,param,available] of [['matrices','matrix',data.matrices],['quotas','quota',data.quotas]]){
      if(filters[field].length===available.length)p.set(param,'all');else if(!filters[field].length)p.set(param,'none');else for(const name of filters[field])p.append(param,name);
    }
    if(filters.search)p.set('search',filters.search);
    const hash='#'+p.toString();if(location.hash!==hash){try{history.replaceState(null,'',hash);}catch{location.hash=hash;}}
  }
  function options(id,items,value,allLabel){
    $(id).innerHTML=(allLabel?`<option value="all">${escape(allLabel)}</option>`:'')+items.map(i=>`<option value="${escape(i.id??i)}">${escape(i.name??i)}</option>`).join('');$(id).value=value;
  }
  function toast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,5000);}
  class Picker{
    constructor(id,inputId,placeholder,items,selected,onSelect,multiple){
      Object.assign(this,{items,selected,onSelect,multiple});this.element=$(id);
      this.element.innerHTML=`<div class="picker"><div class="selected-items"></div><input id="${inputId}" type="search" placeholder="${placeholder}" autocomplete="off" aria-controls="${id}-options"><div id="${id}-options" class="picker-list"></div></div>`;
      this.input=this.element.querySelector('input');this.list=this.element.querySelector('.picker-list');
      this.input.addEventListener('input',()=>this.showOptions());
      this.input.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();this.list.querySelector('button,input')?.focus();}if(e.key==='Escape'){this.input.value='';this.showOptions();}});
      this.element.addEventListener('click',e=>{
        const remove=e.target.closest('[data-remove]');if(remove){onSelect(selected().filter(id=>id!==remove.dataset.remove));this.refresh();return;}
        const button=e.target.closest('button[data-id]');if(button){onSelect([button.dataset.id]);this.input.value='';this.refresh();this.input.focus();}
      });
      this.element.addEventListener('change',e=>{if(!e.target.matches('input[data-id]'))return;const id=e.target.dataset.id;onSelect(e.target.checked?[...new Set([...selected(),id])]:selected().filter(v=>v!==id));this.refresh();});
    }
    refresh(){
      this.element.querySelector('.selected-items').innerHTML=this.selected().map(id=>{
        const item=this.items.find(i=>i.id===id);if(!item)return '';
        return `<div class="selected-item" title="${escape(item.address||item.name)}"><span>${escape(item.name)}${item.state?`<small>${escape(item.state)} · ${escape(item.codes.join(' / '))}</small>`:''}</span>${this.multiple?`<button type="button" class="remove-item" data-remove="${id}" aria-label="Remove ${escape(item.name)}">×</button>`:''}</div>`;
      }).join('');this.showOptions();
    }
    showOptions(){
      const q=this.input.value.trim().toLowerCase(),selected=this.selected();
      this.list.hidden=!this.multiple&&!q&&selected.length>0;if(this.list.hidden)return;
      // Empty course selection is intentionally compact until the user searches.
      if(this.items===data.branches&&!q&&!selected.length){this.list.hidden=true;return;}
      const found=this.items.filter(i=>[i.name,i.state,i.address,...(i.codes||[]),...(i.sourceNames||[])].filter(Boolean).join(' ').toLowerCase().includes(q));
      this.list.innerHTML=found.slice(0,30).map(i=>{
        const checked=selected.includes(i.id),detail=i.state?`${i.state} · ${i.codes.join(' / ')}`:'';
        const label=`<span>${escape(i.name)}${detail?`<small>${escape(detail)}</small>`:''}</span>`;
        return this.multiple?`<label class="picker-option ${checked?'selected':''}" title="${escape(i.address||i.name)}"><input type="checkbox" data-id="${i.id}" ${checked?'checked':''}>${label}</label>`:`<button class="picker-option" data-id="${i.id}" title="${escape(i.address||i.name)}">${label}</button>`;
      }).join('')||'<p class="picker-empty">No matches. Try a name, state or institute code.</p>';
      if(found.length>30)this.list.insertAdjacentHTML('beforeend',`<p class="picker-hint">${format(found.length)} matches. Type to narrow the list.</p>`);
    }
  }
  const collegePicker=new Picker('college-picker','college-search','Find a college…',data.colleges,()=>[filters.college],ids=>change('college',ids[0]),false);
  const comparePicker=new Picker('compare-picker','compare-search','Add a college…',data.colleges,()=>filters.colleges,ids=>change('colleges',ids),true);
  const branchPicker=new Picker('branch-picker','branch-search','Find a branch…',data.branches,()=>filters.branches,ids=>change('branches',ids),true);
  for(const [id,list] of [['matrix-options',data.matrices],['quota-options',data.quotas]]){
    $(id).innerHTML=list.map(name=>`<label class="picker-option"><input type="checkbox" value="${escape(name)}"><span>${escape(name)}</span></label>`).join('');
    $(id).addEventListener('change',()=>change(id==='matrix-options'?'matrices':'quotas',[...$(id).querySelectorAll('input:checked')].map(i=>i.value)));
  }
  function syncChecks(){
    for(const [id,values] of [['matrix-options',filters.matrices],['quota-options',filters.quotas]])for(const input of $(id).querySelectorAll('input')){input.checked=values.includes(input.value);input.closest('label').classList.toggle('selected',input.checked);}
    $('quota-selection').textContent=filters.quotas.length===data.quotas.length?'All quotas':filters.quotas.length===0?'Choose quotas':filters.quotas.length===1?filters.quotas[0]:`${filters.quotas.length} quotas selected`;
  }
  function syncControls(){
    options('state',states,filters.state,'All states / union territories');options('compare-branch',data.branches,filters.branch);
    $('change').value=filters.change;$('include-additions').checked=filters.includeAdditions;$('result-search').value=filters.search;syncChecks();
    for(const button of document.querySelectorAll('[data-view]')){const active=button.dataset.view===filters.view;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
    for(const view of ['college','compare','state'])$(view+'-panel').hidden=filters.view!==view;
    for(const picker of [collegePicker,comparePicker,branchPicker])picker.refresh();$('share').disabled=false;
  }
  function change(name,value){
    filters[name]=value;if(name==='view'){filters.search='';filters.sort='name';filters.direction='asc';syncControls();}
    if(['quotas','matrices'].includes(name))syncChecks();render();
  }
  function renderSummary(){
    const s=core.summarize(rows),pct=s.seats2025?s.delta/s.seats2025*100:null;
    $('stats').innerHTML=`<div class="stat"><span>2025 comparison seats</span><strong>${format(s.seats2025)}</strong><small>${filters.includeAdditions?`${format(s.base2025)} original + ${format(s.added2025)} added`:'Original matrix only'}</small></div><div class="stat"><span>2026 matrix seats</span><strong>${format(s.seats2026)}</strong><small>Supplied 2026 snapshots</small></div><div class="stat ${s.delta>=0?'positive':'negative'}"><span>Net seat change</span><strong>${signed(s.delta)}</strong><small>${pct===null?'No 2025 seats to compare':percent(pct)+' versus 2025'}</small></div><div class="stat"><span>Colleges with seats</span><strong class="stat-neutral">${format(s.colleges2025)} → ${format(s.colleges2026)}</strong><small>${format(s.newColleges)} newly listed in this view</small></div>`;
    const blocks=[['Newly listed colleges',s.newCollegeSeats,`${format(s.newColleges)} colleges absent from the baseline`,false],['Increases at existing colleges',s.existingIncreases,`${format(s.growingColleges)} colleges with positive row changes`,false],['Reductions at existing colleges',-s.existingReductions,'Includes courses or quota listings no longer present',true],['Colleges absent from 2026',-s.missingCollegeSeats,`${format(s.missingColleges)} colleges; not proof of closure`,true]];
    $('growth-breakdown').innerHTML=blocks.map(([label,value,detail,loss])=>`<div class="growth-item ${loss?'loss':''}"><span>${label}</span><strong>${signed(value)}</strong><small>${detail}</small></div>`).join('');
    const gains=s.newCollegeSeats+s.existingIncreases;
    $('growth-bar').innerHTML=`<span style="width:${gains?s.newCollegeSeats/gains*100:0}%"></span><span style="width:${gains?s.existingIncreases/gains*100:0}%"></span>`;
    $('growth-context').textContent=rows.length?`${format(gains)} positive seat changes: ${format(s.newCollegeSeats)} at newly listed colleges and ${format(s.existingIncreases)} at existing colleges. Existing colleges retained in 2026 have a net change of ${signed(s.existingNet)}; their increases include ${format(s.newCourseSeats)} seats in new course listings. After all reductions, the overall change is ${signed(s.delta)}.`:'Choose a college, state or course to see the contribution to seat changes.';
  }
  function render(){
    rows=core.sorted(core.query(data,filters),filters.sort,filters.direction,filters.view);renderSummary();
    const c=colleges.get(filters.college);
    const heading={college:['COLLEGE OVERVIEW',c?.name||'Choose a college',`${c?.state||''} · Institute code(s): ${c?.codes.join(' / ')||''}`],compare:['COLLEGE COMPARISON',branches.get(filters.branch)?.name||'Choose a course',`${filters.colleges.length} selected colleges · 2025 and 2026 side by side`],state:['EXPLORE A STATE',filters.state==='all'?'All states & union territories':filters.state,filters.branches.length?filters.branches.map(id=>branches.get(id)?.name).join(' · '):'All courses · 2025 and 2026 side by side']}[filters.view];
    $('results-eyebrow').textContent=heading[0];$('results-title').textContent=heading[1];$('results-description').textContent=heading[2];
    const pills=[filters.includeAdditions?'2025 includes additions':'2025 original matrix',...(filters.matrices.length===data.matrices.length?['All matrices']:filters.matrices),...(filters.quotas.length===data.quotas.length?['All quotas']:filters.quotas)];
    $('active-filters').innerHTML=pills.map(p=>`<span class="filter-pill">${escape(p)}</span>`).join('');
    $('export').disabled=!rows.length;$('empty').hidden=Boolean(rows.length);$('table-container').hidden=!rows.length;$('clear-result-search').hidden=!filters.search;
    $('empty-message').textContent=!filters.matrices.length?'Select at least one seat matrix.':!filters.quotas.length?'Select at least one allotment quota.':filters.view==='compare'&&!filters.colleges.length?'Choose colleges to compare.':'Try another course, quota or change filter. Search includes both years and all matching rows.';
    cancelAnimationFrame(scrollFrame);scrollFrame=0;rendered=0;
    const sort=(field,label)=>`<button data-sort="${field}" aria-label="Sort by ${label}">${label}<span class="sort-arrow" aria-hidden="true">${filters.sort===field?(filters.direction==='asc'?'↑':'↓'):'↕'}</span></button>`;
    const aria=field=>filters.sort===field?(filters.direction==='asc'?'ascending':'descending'):'none';
    $('table-container').innerHTML=`<table class="seat-table" aria-rowcount="${rows.length+1}"><caption class="skip-link">2025 and 2026 seat matrix comparison</caption><colgroup><col class="college-column"><col class="group-column"><col span="5" class="seat-column"><col class="change-column"><col class="context-column"></colgroup><thead><tr aria-rowindex="1"><th scope="col" aria-sort="${aria('name')}">${sort('name',filters.view==='college'?'Branch / course':'College / course')}</th><th scope="col">Matrix / quota</th>${[['base','2025 original',''],['added','2025 added',''],['seats2025','2025 total','baseline-head'],['seats2026','2026 seats','year-new'],['delta','Change','']].map(([field,label,cls])=>`<th scope="col" class="seat-head ${cls}" aria-sort="${aria(field)}">${sort(field,label)}</th>`).join('')}<th scope="col" class="seat-head" aria-sort="${aria('percent')}">${sort('percent','Change %')}</th><th scope="col">Context</th></tr></thead><tbody id="seat-rows"></tbody></table>`;
    $('table-container').scrollTop=0;appendRows();writeHash();
  }
  function markup(row,index){
    const label=filters.view==='college'?row.branch.name:row.college.name;
    const secondary=filters.view==='college'?'':`${row.college.state} · ${row.branch.name}`;
    const num=(n,cls='')=>`<td class="rank-cell ${cls}"><span class="rank-value ${n===0?'muted-number':''}">${format(n)}</span></td>`;
    return `<tr aria-rowindex="${index+2}"><td title="${escape(row.college.address)}"><span class="primary-label">${escape(label)}</span>${secondary?`<span class="secondary-label">${escape(secondary)}</span>`:''}<span class="code-label">${escape(row.college.codes.join(' / '))}</span></td><td class="group-cell">${escape(row.matrix)}<span class="secondary-label">${escape(row.quota)}</span></td>${num(row.base)}<td class="rank-cell" title="${filters.includeAdditions?'Included in the 2025 total':'Excluded from the 2025 total'}"><span class="rank-value ${row.added===0?'muted-number':''}">${format(row.added)}</span>${!filters.includeAdditions&&row.added?'<span class="rank-caption">excluded</span>':''}</td>${num(row.seats2025,'baseline-cell')}${num(row.seats2026,'year-new')}<td class="rank-cell"><span class="rank-value ${row.delta>0?'delta-positive':row.delta<0?'delta-negative':'muted-number'}">${signed(row.delta)}</span></td><td class="rank-cell"><span class="rank-value">${percent(row.percent)}</span>${row.percent===null?'<span class="rank-caption">no 2025 seats</span>':''}</td><td class="status-cell"><span class="status-badge ${row.isNewCollege?'new':row.delta<0?'loss':''}">${escape(row.status)}</span></td></tr>`;
  }
  function appendRows(){
    const end=Math.min(rendered+batch,rows.length);$('seat-rows').insertAdjacentHTML('beforeend',rows.slice(rendered,end).map((r,i)=>markup(r,rendered+i)).join(''));rendered=end;
    $('row-count').textContent=!rows.length?'0 matching rows':rendered<rows.length?`Showing ${format(rendered)} of ${format(rows.length)} rows`:`${format(rows.length)} matching rows`;
    $('scroll-hint').textContent=!rows.length?'':rendered<rows.length?'Scroll for more rows':'All results loaded';$('back-to-top').hidden=$('table-container').scrollTop<200;
  }
  for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>change('view',button.dataset.view));
  for(const [id,name] of [['state','state'],['compare-branch','branch'],['change','change']])$(id).addEventListener('change',e=>change(name,e.target.value));
  $('include-additions').addEventListener('change',e=>change('includeAdditions',e.target.checked));
  $('result-search').addEventListener('input',e=>change('search',e.target.value));
  $('clear-result-search').addEventListener('click',()=>{$('result-search').value='';change('search','');});
  $('quota-all').addEventListener('click',()=>change('quotas',data.quotas.slice()));$('quota-clear').addEventListener('click',()=>change('quotas',[]));
  $('quota-picker').addEventListener('keydown',e=>{if(e.key==='Escape'){$('quota-picker').open=false;$('quota-summary').focus();}});
  document.addEventListener('click',e=>{if(!$('quota-picker').contains(e.target))$('quota-picker').open=false;});
  $('reset').addEventListener('click',()=>{const view=filters.view;filters={...defaults(),view};for(const picker of [collegePicker,comparePicker,branchPicker])picker.input.value='';syncControls();render();});
  $('table-container').addEventListener('scroll',()=>{if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;const c=$('table-container');$('back-to-top').hidden=c.scrollTop<200;if(rendered<rows.length&&c.scrollHeight-c.scrollTop-c.clientHeight<400)appendRows();});},{passive:true});
  $('back-to-top').addEventListener('click',()=>{$('table-container').scrollTop=0;$('table-container').focus({preventScroll:true});});
  $('table-container').addEventListener('click',e=>{const button=e.target.closest('[data-sort]');if(!button)return;const field=button.dataset.sort;filters.direction=filters.sort===field&&filters.direction==='asc'?'desc':'asc';filters.sort=field;render();});
  $('export').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([core.csv(rows,filters.includeAdditions)],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`neet-seats-2025-2026-${filters.view}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(`Exported all ${format(rows.length)} matching rows.`);});
  $('share').addEventListener('click',async()=>{writeHash();if(location.protocol==='file:'||['localhost','127.0.0.1'].includes(location.hostname)){toast('Publish this folder on GitHub Pages to share the view. Your filters are saved in the address bar.');return;}try{await navigator.clipboard.writeText(location.href);toast('View link copied, including the comparison baseline and selected filters.');}catch{toast('Copy the browser address to share this view.');}});
  window.addEventListener('hashchange',()=>{readHash();syncControls();render();});
  const q=data.quality;
  $('data-quality').innerHTML=`<p><strong>Coverage:</strong> ${format(q.colleges)} college/campus records and ${q.branches} courses. ${q.campusAliases.length} reviewed campus code groups and ${q.missingCodeResolutions.length} source rows with resolved missing codes are included in the audit.</p><p class="quality-banner">${q.unknownStates.length} college records lack an identifiable state in the supplied files. They remain available under “Unknown (not stated)” and in all-state totals. State comparisons may omit these records.</p><div class="source-table-wrap"><table class="quality-table"><thead><tr><th scope="col">Source file</th><th scope="col">Format</th><th scope="col">Seats</th><th scope="col">Headers / totals</th></tr></thead><tbody>${q.sources.map(s=>`<tr><td>${escape(s.file)}</td><td>${escape(s.schema)}</td><td>${format(s.seats)}</td><td>Verified</td></tr>`).join('')}</tbody></table></div>`;
  readHash();syncControls();render();
})();
