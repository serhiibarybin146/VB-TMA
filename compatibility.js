// Compatibility combines each finished point, including derived and contour points.
function compatibilityDetails(data) {
    const r = n => MatrixLogic.reduce(n), U = data.U, center = data.points.centerValue;
    const innerA = r(U[4]+U[6]);
    return {
        extra: {greenLeft:r(U[0]+center),greenTop:r(U[2]+center),innerA,
            innerB:r(U[4]+innerA),innerC:r(U[6]+innerA)},
        contour:data.values.map((a,i)=>{
            const b=data.values[(i+1)%8],m=r(a+b),l=r(a+m),h=r(m+b);
            return [r(a+l),l,r(l+m),m,r(m+h),h,r(h+b)];
        })
    };
}
function calculateCompatibility(first, second) {
    const r = n => MatrixLogic.reduce(n), a=compatibilityDetails(first),b=compatibilityDetails(second);
    const combine = (x,y) => x.map((v,i)=>r(v+y[i]));
    return {date:null,points:Object.fromEntries(Object.keys(first.points).map(k=>[k,r(first.points[k]+second.points[k])])),
        values:combine(first.values,second.values),U:combine(first.U,second.U),Y:combine(first.Y,second.Y),
        extra:Object.fromEntries(Object.keys(a.extra).map(k=>[k,r(a.extra[k]+b.extra[k])])),
        contour:a.contour.map((row,i)=>combine(row,b.contour[i]))};
}
function initCompatibility() {
    const form=document.getElementById('compatibilityForm');
    for (const i of [1,2]) document.getElementById(`partnerDate${i}`).addEventListener('input',e=>{
        const d=e.target.value.replace(/\D/g,'').slice(0,8);
        e.target.value=d.slice(0,2)+(d.length>2?'.'+d.slice(2,4):'')+(d.length>4?'.'+d.slice(4):'');
    });
    form.addEventListener('submit',e=>{
        e.preventDefault();
        if (!checkPermission('compatibility')) { showLockedModal('compatibility'); return; }
        const partners=[];
        for(const i of [1,2]){
            const name=document.getElementById(`partnerName${i}`).value.trim();
            const value=document.getElementById(`partnerDate${i}`).value;
            if(!name || !/^\d{2}\.\d{2}\.\d{4}$/.test(value)){tg.showAlert(`Проверьте имя и дату рождения партнёра ${i}`);return;}
            const [d,m,y]=value.split('.').map(Number),date=new Date(y,m-1,d);
            if(y<1900||date.getFullYear()!==y||date.getMonth()!==m-1||date.getDate()!==d||date>new Date()){
                tg.showAlert(`Проверьте дату рождения партнёра ${i}`);return;
            }
            partners.push({name,value,data:MatrixLogic.calculateBase(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`)});
        }
        partners.forEach((p,i)=>{
            document.getElementById(`compatTitle${i+1}`).textContent=p.name;
            document.getElementById(`compatSubtitle${i+1}`).textContent=`Основная матрица · ${p.value}`;
            drawFullMatrixSVG(p.data,`compatSvg${i+1}`);
        });
        document.getElementById('compatTitle3').textContent=`${partners[0].name} + ${partners[1].name}`;
        document.getElementById('compatSubtitle3').textContent='Матрица совместимости';
        drawFullMatrixSVG(calculateCompatibility(partners[0].data,partners[1].data),'compatSvg3');
        showView('compatibilityResultView');

    });
}
initCompatibility();
