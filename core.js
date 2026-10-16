(function(root){
  'use strict';
  function query(data,filters){
    const includeAdditions=filters.includeAdditions!==false, baselineBits=includeAdditions?3:1;
    const matrices=new Set(filters.matrices??data.matrices),quotas=new Set(filters.quotas??data.quotas);
    const chosenColleges=new Set(filters.colleges||[]),chosenBranches=new Set(filters.branches||[]);
    // College and course history is assessed BEFORE applying user filters.
    const earlierCourses=new Set(data.rows.filter(r=>r[7]&baselineBits).map(r=>r[0]+':'+r[1]));
    const search=(filters.search||'').trim().toLowerCase();
    const result=[];
    for(const source of data.rows){
      const [ci,bi,mi,qi,base,added,seats2026,presence]=source;
      const college=data.colleges[ci],branch=data.branches[bi],matrix=data.matrices[mi],quota=data.quotas[qi];
      if(!matrices.has(matrix)||!quotas.has(quota))continue;
      if(filters.view==='college'&&college.id!==filters.college)continue;
      if(filters.view==='compare'&&(!chosenColleges.has(college.id)||branch.id!==filters.branch))continue;
      if(filters.view==='state'&&((filters.state!=='all'&&college.state!==filters.state)||(chosenBranches.size&&!chosenBranches.has(branch.id))))continue;
      const seats2025=base+(includeAdditions?added:0),delta=seats2026-seats2025;
      if(base+added+seats2026===0)continue;
      const isNewCollege=!(college.presence&baselineBits);
      const isMissingCollege=!(college.presence&4);
      const isNewCourse=!isNewCollege&&!earlierCourses.has(ci+':'+bi)&&seats2026>0;
      let status='Unchanged';
      if(seats2025===0&&seats2026===0&&added>0)status='2025 additions excluded';
      else if(isNewCollege&&seats2026>0)status='Newly listed college';
      else if(isMissingCollege)status='College not listed in 2026';
      else if(seats2026===0)status='Listing not in 2026';
      else if(isNewCourse)status='New course at existing college';
      else if(seats2025===0)status='New quota / matrix listing';
      else if(delta>0)status='Increased';
      else if(delta<0)status='Reduced';
      const row={college,branch,matrix,quota,base,added,seats2025,seats2026,delta,percent:seats2025?delta/seats2025*100:null,isNewCollege,isMissingCollege,isNewCourse,status,presence};
      if(filters.change==='increased'&&delta<=0)continue;
      if(filters.change==='decreased'&&delta>=0)continue;
      if(filters.change==='new'&&!isNewCollege)continue;
      if(filters.change==='existing'&&isNewCollege)continue;
      if(filters.change==='newcourses'&&!isNewCourse)continue;
      if(filters.change==='missing'&&!isMissingCollege)continue;
      if(search&&![college.name,college.address,...college.codes,branch.name,matrix,quota,status].join(' ').toLowerCase().includes(search))continue;
      result.push(row);
    }
    return result;
  }
  function summarize(rows){
    const s={base2025:0,added2025:0,seats2025:0,seats2026:0,delta:0,newCollegeSeats:0,existingIncreases:0,existingReductions:0,missingCollegeSeats:0,newCourseSeats:0};
    const colleges2025=new Set(),colleges2026=new Set(),newColleges=new Set(),growingColleges=new Set(),missingColleges=new Set();
    for(const r of rows){
      s.base2025+=r.base;s.added2025+=r.added;s.seats2025+=r.seats2025;s.seats2026+=r.seats2026;s.delta+=r.delta;
      if(r.seats2025>0)colleges2025.add(r.college.id);
      if(r.seats2026>0)colleges2026.add(r.college.id);
      if(r.isNewCollege){s.newCollegeSeats+=r.seats2026;if(r.seats2026>0)newColleges.add(r.college.id);}
      else if(r.isMissingCollege){s.missingCollegeSeats+=r.seats2025;if(r.seats2025>0)missingColleges.add(r.college.id);}
      else if(r.delta>0){s.existingIncreases+=r.delta;growingColleges.add(r.college.id);}
      else s.existingReductions-=r.delta;
      if(r.isNewCourse)s.newCourseSeats+=r.seats2026;
    }
    return {...s,colleges2025:colleges2025.size,colleges2026:colleges2026.size,newColleges:newColleges.size,growingColleges:growingColleges.size,missingColleges:missingColleges.size,existingNet:s.existingIncreases-s.existingReductions};
  }
  function sorted(rows,field='name',direction='asc',view='state'){
    const label=r=>view==='college'?r.branch.name:r.college.name;
    const sign=direction==='desc'?-1:1;
    return [...rows].sort((a,b)=>{
      let comparison=field==='name'?label(a).localeCompare(label(b)):(a[field]-b[field]);
      if(field==='percent'){
        if(a.percent===null&&b.percent!==null)return 1;
        if(b.percent===null&&a.percent!==null)return -1;
        comparison=(a.percent??0)-(b.percent??0);
      }
      return comparison*sign||label(a).localeCompare(label(b))||a.college.id.localeCompare(b.college.id)||a.branch.name.localeCompare(b.branch.name)||a.matrix.localeCompare(b.matrix)||a.quota.localeCompare(b.quota);
    });
  }
  function csv(rows,includeAdditions=true){
    const header=['College','State','Institute codes','Course','Matrix','Quota','2025 original seats','2025 mid-counselling additions','Additions included in comparison','2025 comparison seats','2026 seats','Seat change','Percent change','Context'];
    const safe=value=>{const text=String(value??'');return '"'+(/^[=+@\-\t\r]/.test(text)&&typeof value!=='number'?"'":'')+text.replace(/"/g,'""')+'"';};
    return '\uFEFF'+[header,...rows.map(r=>[r.college.name,r.college.state,r.college.codes.join(' / '),r.branch.name,r.matrix,r.quota,r.base,r.added,includeAdditions?'Yes':'No',r.seats2025,r.seats2026,r.delta,r.percent===null?'':Number(r.percent.toFixed(2)),r.status])].map(row=>row.map(safe).join(',')).join('\r\n');
  }
  const api={query,summarize,sorted,csv};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SEAT_CORE=api;
})(typeof window==='undefined'?globalThis:window);
