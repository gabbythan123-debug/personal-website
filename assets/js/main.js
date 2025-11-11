function calculateBMI(){
  const heightEl=document.getElementById('height');
  const weightEl=document.getElementById('weight');
  if(!heightEl||!weightEl) return;
  const height=Number(heightEl.value);
  const weight=Number(weightEl.value);
  if(!height||!weight){alert('Please enter both height and weight');return}
  const m=height/100;
  const bmi=+(weight/(m*m)).toFixed(1);
  let category='';
  if(bmi<18.5)category='Underweight';else if(bmi<25)category='Normal weight';else if(bmi<30)category='Overweight';else category='Obesity';
  const outVal=document.getElementById('bmiValue');
  const outCat=document.getElementById('bmiCategory');
  const outWrap=document.getElementById('bmiResult');
  if(outVal)outVal.textContent=bmi;
  if(outCat)outCat.textContent=category;
  if(outWrap)outWrap.style.display='block';
}

function calculateCrCl(){
  const ageEl=document.getElementById('age');
  const weightEl=document.getElementById('weightCrCl');
  const scrEl=document.getElementById('serumCr');
  const femaleEl=document.getElementById('female');
  if(!ageEl||!weightEl||!scrEl) return;
  const age=Number(ageEl.value),weight=Number(weightEl.value),scr=Number(scrEl.value);
  if(!age||!weight||!scr){alert('Please enter all required values');return}
  let crcl=((140-age)*weight)/(72*scr);
  if(femaleEl&&femaleEl.checked)crcl=crcl*0.85;
  const out=document.getElementById('crclValue');
  const wrap=document.getElementById('crclResult');
  if(out)out.textContent=crcl.toFixed(2);
  if(wrap)wrap.style.display='block';
}

function checkInteractions(){
  const d1=document.getElementById('drug1');
  const d2=document.getElementById('drug2');
  const d3=document.getElementById('drug3');
  if(!d1||!d2) return;
  if(!d1.value||!d2.value){alert('Please enter at least two drugs');return}
  const drugs=[d1.value,d2.value];
  if(d3&&d3.value)drugs.push(d3.value);
  const resultsDiv=document.getElementById('interactionResults');
  if(!resultsDiv) return;
  resultsDiv.innerHTML=`<h5>Interactions for: ${drugs.join(', ')}</h5><p>No significant interactions were detected in this simulated check. Verify with authoritative resources before clinical use.</p>`;
  resultsDiv.className='alert alert-info';
}

document.addEventListener('DOMContentLoaded',function(){
  const tTriggers=[].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tTriggers.map(function(el){return new bootstrap.Tooltip(el)});
});

async function loadDrugs(){
  try{
    const res=await fetch('assets/data/drugs.json');
    if(!res.ok)throw new Error('Could not load drugs.json');
    const data=await res.json();
    window._MIHP_DRUGS=data||[];
    renderFeaturedCategories(data);
    return window._MIHP_DRUGS;
  }catch(err){
    console.error('loadDrugs error',err);
    window._MIHP_DRUGS=[];
    return window._MIHP_DRUGS;
  }
}

function renderFeaturedCategories(drugs){
  if(!drugs||!Array.isArray(drugs))return;
  const container=document.getElementById('drug-categories');
  if(!container)return;
  const groups={};
  drugs.forEach(d=>{groups[d.category]=groups[d.category]||[];groups[d.category].push(d)});
  container.innerHTML=Object.keys(groups).slice(0,6).map(cat=>{
    const items=groups[cat].slice(0,3).map(i=>`<li class="list-group-item">${i.brand} (${i.generic})</li>`).join('');
    return `
      <div class="col-md-4">
        <div class="card h-100"><div class="card-body">
          <h5 class="card-title">${cat}</h5>
          <ul class="list-group list-group-flush mb-3">${items}</ul>
          <button class="btn btn-sm btn-outline-primary browse-all" data-category="${cat}">Browse All</button>
        </div></div>
      </div>
    `;
  }).join('');
  document.querySelectorAll('.browse-all').forEach(btn=>btn.addEventListener('click',onBrowseAll));
}

function onBrowseAll(e){
  const cat=e.currentTarget.getAttribute('data-category');
  const list=(window._MIHP_DRUGS||[]).filter(d=>d.category===cat);
  const modalBody=document.querySelector('#browseModal .modal-body');
  if(!modalBody)return;
  modalBody.innerHTML=`<h6>${cat} — ${list.length} result(s)</h6>`+`<div class="list-group mt-3">`+list.map(d=>`<div class="list-group-item"><strong>${d.brand}</strong> — ${d.generic}<br><small class="text-muted">${d.notes||''}</small></div>`).join('')+`</div>`;
  const browseModal=new bootstrap.Modal(document.getElementById('browseModal'));
  browseModal.show();
}

document.addEventListener('DOMContentLoaded',function(){loadDrugs()});

let _searchDebounce=null;
function searchDrugs(query){
  if(!query||!window._MIHP_DRUGS)return[];
  const q=query.trim().toLowerCase();
  if(!q)return[];
  return window._MIHP_DRUGS.filter(d=>{
    return (d.brand&&d.brand.toLowerCase().includes(q))||(d.generic&&d.generic.toLowerCase().includes(q))||(d.category&&d.category.toLowerCase().includes(q))||(d.notes&&d.notes.toLowerCase().includes(q));
  }).slice(0,20);
}

function renderSearchResults(results,container){
  if(!container)return;
  if(!results||results.length===0){container.innerHTML='<div class="list-group-item">No results</div>';container.style.display='block';return}
  container.innerHTML=results.map((d,i)=>{const brand=(d.brand||'').replace(/</g,'&lt;');const generic=(d.generic||'').replace(/</g,'&lt;');const category=(d.category||'').replace(/</g,'&lt;');return `<button type="button" class="list-group-item list-group-item-action search-result-item" data-idx="${i}"><strong>${brand}</strong> — ${generic}<br><small class="text-muted">${category}</small></button>`}).join('');
  container.style.display='block';
}

document.addEventListener('DOMContentLoaded',function(){
  const searchInput=document.getElementById('siteSearchInput');
  const resultsContainer=document.getElementById('searchResults');
  if(!searchInput||!resultsContainer)return;
  document.addEventListener('click',function(e){if(!resultsContainer.contains(e.target)&&e.target!==searchInput){resultsContainer.style.display='none'}});
  searchInput.addEventListener('input',function(e){const q=e.target.value||'';if(_searchDebounce)clearTimeout(_searchDebounce);_searchDebounce=setTimeout(async function(){if(!window._MIHP_DRUGS)await loadDrugs();const results=searchDrugs(q);renderSearchResults(results,resultsContainer)},250)});
  searchInput.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();const first=resultsContainer.querySelector('.search-result-item');if(first){const idx=Number(first.getAttribute('data-idx'))||0;const results=searchDrugs(searchInput.value||'');const drug=results[idx];if(drug)showDrugDetails(drug);resultsContainer.style.display='none'}}});
  resultsContainer.addEventListener('click',function(e){const btn=e.target.closest('.search-result-item');if(!btn)return;const idx=Number(btn.getAttribute('data-idx'))||0;const query=searchInput.value||'';const results=searchDrugs(query);const drug=results[idx];if(drug)showDrugDetails(drug);resultsContainer.style.display='none'});
});

function showDrugDetails(drug){
  const toastEl=document.getElementById('drugToast');
  const titleEl=document.getElementById('drugToastTitle');
  const catEl=document.getElementById('drugToastCategory');
  const bodyEl=document.getElementById('drugToastBody');
  const title=`${drug.brand||''}${drug.generic? ' — '+drug.generic : ''}`;
  const category=drug.category||'';
  const notes=drug.notes||'';
  if(!toastEl||!titleEl||!bodyEl){return alert(`${title}\n${category}\n${notes}`)}
  titleEl.textContent=title;catEl.textContent=category;bodyEl.textContent=notes;const bsToast=new bootstrap.Toast(toastEl,{autohide:true,delay:6000});bsToast.show();
}

document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('.drug-list table tbody tr').forEach(function(tr){tr.style.cursor='pointer';tr.addEventListener('click',function(){const cells=tr.querySelectorAll('td');if(!cells||cells.length<4)return;const drug={brand:cells[0].textContent.trim(),generic:cells[1].textContent.trim(),category:cells[2].textContent.trim(),notes:cells[3].textContent.trim()};showDrugDetails(drug)})})});

document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('.pills-container').forEach(function(container){const scroller=container.querySelector('.pills-scroll');const prev=container.querySelector('.pill-nav-btn.prev');const next=container.querySelector('.pill-nav-btn.next');if(!scroller)return; if(prev&&!prev.hasAttribute('aria-label'))prev.setAttribute('aria-label','Scroll categories left'); if(next&&!next.hasAttribute('aria-label'))next.setAttribute('aria-label','Scroll categories right'); function scrollStep(){return Math.max(140,Math.floor(scroller.clientWidth*0.7))} if(prev)prev.addEventListener('click',function(e){e.preventDefault();scroller.scrollBy({left:-scrollStep(),behavior:'smooth'})}); if(next)next.addEventListener('click',function(e){e.preventDefault();scroller.scrollBy({left:scrollStep(),behavior:'smooth'})}); let isTouching=false,startX=0,scrollLeft=0; scroller.addEventListener('touchstart',function(e){isTouching=true;startX=e.touches[0].pageX-scroller.offsetLeft;scrollLeft=scroller.scrollLeft},{passive:true}); scroller.addEventListener('touchmove',function(e){if(!isTouching)return;const x=e.touches[0].pageX-scroller.offsetLeft;const walk=(startX-x);scroller.scrollLeft=scrollLeft+walk},{passive:true}); scroller.addEventListener('touchend',function(){isTouching=false});})});


