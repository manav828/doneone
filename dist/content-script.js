let o=null;chrome.runtime.onMessage.addListener((e,a,n)=>(e.action==="show-quick-add"&&(g(e.data),n({success:!0})),!0));function g(e){l(),o=document.createElement("div"),o.id="flowboard-quick-add-modal",o.style.cssText=`
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
  `;const a=document.createElement("div");a.style.cssText=`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2px;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
  `;const n=document.createElement("div");n.style.cssText=`
    background: white;
    border-radius: 14px;
    padding: 24px;
  `;const p=document.createElement("h2");p.textContent="📋 Add Task to FlowBoard",p.style.cssText=`
    margin: 0 0 20px 0;
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
  `;const f=e.selectedText||document.title,t=document.createElement("input");t.type="text",t.placeholder="Task title...",t.value=f,t.style.cssText=`
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 12px;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  `,t.onfocus=()=>{t.style.borderColor="#667eea"},t.onfocus=()=>{t.style.borderColor="#e5e7eb"};const r=document.createElement("textarea");r.placeholder="Description (optional)...",r.value=`📎 From: ${e.url}`,r.style.cssText=`
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 16px;
    outline: none;
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
    box-sizing: border-box;
  `,r.onfocus=()=>{r.style.borderColor="#667eea"},r.onblur=()=>{r.style.borderColor="#e5e7eb"};const u=document.createElement("div");u.style.cssText=`
    background: #f3f4f6;
    padding: 10px 12px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 12px;
    color: #6b7280;
  `,u.innerHTML=`
    <div style="margin-bottom: 4px;">📎 <strong>Captured from:</strong></div>
    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${e.url}</div>
  `;const c=document.createElement("div");c.style.cssText=`
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  `;const i=document.createElement("button");i.textContent="Cancel",i.style.cssText=`
    padding: 10px 20px;
    border: 2px solid #e5e7eb;
    background: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  `,i.onmouseenter=()=>{i.style.background="#f9fafb"},i.onmouseleave=()=>{i.style.background="white"},i.onclick=l;const s=document.createElement("button");s.textContent="Add Task",s.style.cssText=`
    padding: 10px 20px;
    border: none;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  `,s.onmouseenter=()=>{s.style.transform="scale(1.05)"},s.onmouseleave=()=>{s.style.transform="scale(1)"},s.onclick=()=>{const d={title:t.value.trim(),description:r.value.trim(),capturedUrl:e.url,capturedText:e.selectedText,linkUrl:e.linkUrl,srcUrl:e.srcUrl};d.title&&chrome.storage.local.get(["pendingTasks"],b=>{const x=b.pendingTasks||[];x.push({...d,timestamp:Date.now()}),chrome.storage.local.set({pendingTasks:x},()=>{h(),l()})})},c.appendChild(i),c.appendChild(s),n.appendChild(p),n.appendChild(t),n.appendChild(r),n.appendChild(u),n.appendChild(c),a.appendChild(n),o.appendChild(a),document.body.appendChild(o),setTimeout(()=>t.focus(),100);const m=d=>{d.key==="Escape"&&(l(),document.removeEventListener("keydown",m))};document.addEventListener("keydown",m),o.addEventListener("click",d=>{d.target===o&&l()}),t.addEventListener("keydown",d=>{d.key==="Enter"&&s.click()})}function l(){o&&(o.remove(),o=null)}function h(){const e=document.createElement("div");e.textContent="✅ Task added to FlowBoard!",e.style.cssText=`
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
  `;const a=document.createElement("style");a.textContent=`
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
  `,document.head.appendChild(a),document.body.appendChild(e),setTimeout(()=>{e.style.animation="slideOut 0.3s ease-out",setTimeout(()=>e.remove(),300)},3e3)}window.location.href.startsWith("chrome-extension://")||console.log("FlowBoard content script loaded");
