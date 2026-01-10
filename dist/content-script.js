let d=null;chrome.runtime.onMessage.addListener((t,x,r)=>(t.action==="show-quick-add"&&(j(t.data),r({success:!0})),!0));function j(t){g(),d=document.createElement("div"),d.id="doneone-quick-add-modal",d.style.cssText=`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;const x=document.createElement("div");x.style.cssText=`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2px;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
  `;const r=document.createElement("div");r.style.cssText=`
    background: white;
    border-radius: 14px;
    padding: 24px;
  `;const v=document.createElement("h2");v.textContent="📋 Add Task to DoneOne",v.style.cssText=`
    margin: 0 0 20px 0;
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
  `;const I=t.selectedText||document.title,n=document.createElement("input");n.type="text",n.placeholder="Task title...",n.value=I,n.style.cssText=`
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 12px;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  `,n.onfocus=()=>{n.style.borderColor="#667eea"},n.onblur=()=>{n.style.borderColor="#e5e7eb"};const a=document.createElement("textarea");a.placeholder="Description (optional)...",a.value=`📎 From: ${t.url}`,a.style.cssText=`
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 12px;
    outline: none;
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
    box-sizing: border-box;
  `,a.onfocus=()=>{a.style.borderColor="#667eea"},a.onblur=()=>{a.style.borderColor="#e5e7eb"};const h=document.createElement("div");h.style.cssText=`
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  `;const s=document.createElement("select");s.id="doneone-project-select",s.style.cssText=`
    flex: 1;
    padding: 10px 12px;
    height: 42px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    cursor: pointer;
    background: white;
    box-sizing: border-box;
    color: #1f2937;
  `,s.innerHTML='<option value="" disabled selected>Select Project *</option>';const o=document.createElement("select");o.id="doneone-assignee-select",o.disabled=!0,o.style.cssText=`
    flex: 1;
    padding: 10px 12px;
    height: 42px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    cursor: not-allowed;
    background: #f9fafb;
    box-sizing: border-box;
    color: #9ca3af;
  `,o.innerHTML='<option value="" selected>Assignee (Select Project First)</option>';let f=[],C=[],m=null;chrome.storage.local.get(["cachedProjects","cachedUsers","cachedCurrentUser"],e=>{f=e.cachedProjects||[],C=e.cachedUsers||[],m=e.cachedCurrentUser?e.cachedCurrentUser.id:null,f.forEach(l=>{const u=document.createElement("option");u.value=l.id,u.textContent=l.name,s.appendChild(u)}),f.length===1&&(s.value=f[0].id,w(f[0].id))});const w=e=>{o.innerHTML='<option value="" disabled>Select Assignee</option>',o.disabled=!1,o.style.cursor="pointer",o.style.background="white",o.style.color="#1f2937";const l=f.find(i=>i.id===e);if(!l)return;const u=new Set([l.ownerId,...l.leadIds||[],...l.resourceIds||[]]),z=C.filter(i=>u.has(i.id));let U=!1;z.sort((i,b)=>i.id===m?-1:b.id===m?1:i.name.localeCompare(b.name)),z.forEach(i=>{const b=document.createElement("option");b.value=i.id,b.textContent=i.name,m&&i.id===m&&(b.textContent="Assign to Me",U=!0),o.appendChild(b)}),U&&m&&(o.value=m)};s.addEventListener("change",e=>{w(e.target.value)}),h.appendChild(s),h.appendChild(o);const k=document.createElement("div");k.style.cssText=`
    background: #f3f4f6;
    padding: 10px 12px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 12px;
    color: #6b7280;
  `,k.innerHTML=`
    <div style="margin-bottom: 4px;">📎 <strong>Captured from:</strong></div>
    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.url}</div>
  `;const y=document.createElement("div");y.style.cssText=`
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  `;const c=document.createElement("button");c.textContent="Cancel",c.style.cssText=`
    padding: 10px 20px;
    border: 2px solid #e5e7eb;
    background: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  `,c.onmouseenter=()=>{c.style.background="#f9fafb"},c.onmouseleave=()=>{c.style.background="white"},c.onclick=g;const p=document.createElement("button");p.textContent="Add Task",p.style.cssText=`
    padding: 10px 20px;
    border: none;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  `,p.onmouseenter=()=>{p.style.transform="scale(1.05)"},p.onmouseleave=()=>{p.style.transform="scale(1)"};const T=()=>{if(!s.value){s.style.borderColor="#ef4444";return}const e={title:n.value.trim(),description:a.value.trim(),projectId:s.value,assigneeId:o.value||void 0,capturedUrl:t.url,capturedText:t.selectedText,linkUrl:t.linkUrl,srcUrl:t.srcUrl};e.title&&chrome.storage.local.get(["pendingTasks"],l=>{const u=l.pendingTasks||[];u.push({...e,timestamp:Date.now()}),chrome.storage.local.set({pendingTasks:u},()=>{M(),g()})})};p.onclick=T,y.appendChild(c),y.appendChild(p),r.appendChild(v),r.appendChild(n),r.appendChild(a),r.appendChild(h),r.appendChild(k),r.appendChild(y),x.appendChild(r),d.appendChild(x),document.body.appendChild(d),setTimeout(()=>n.focus(),100);const E=e=>{e.key==="Escape"&&(g(),document.removeEventListener("keydown",E))};document.addEventListener("keydown",E),d.addEventListener("click",e=>{e.target===d&&g()}),n.addEventListener("keydown",e=>{e.key==="Enter"&&T()})}function g(){d&&(d.remove(),d=null)}function M(){const t=document.createElement("div");t.textContent="✅ Task added to DoneOne!",t.style.cssText=`
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;const x=document.createElement("style");x.textContent=`
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `,document.head.appendChild(x),document.body.appendChild(t),setTimeout(()=>{t.style.animation="slideOut 0.3s ease-out",setTimeout(()=>t.remove(),300)},3e3)}window.location.href.startsWith("chrome-extension://")||console.log("DoneOne content script loaded");
