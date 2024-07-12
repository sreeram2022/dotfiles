"use strict";require("./__raycast_check_for_updates");var _=Object.defineProperty;var le=Object.getOwnPropertyDescriptor;var ue=Object.getOwnPropertyNames;var de=Object.prototype.hasOwnProperty;var fe=(e,t)=>{for(var n in t)_(e,n,{get:t[n],enumerable:!0})},pe=(e,t,n,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of ue(t))!de.call(e,a)&&a!==n&&_(e,a,{get:()=>t[a],enumerable:!(i=le(t,a))||i.enumerable});return e};var Se=e=>pe(_({},"__esModule",{value:!0}),e);var ge={};fe(ge,{default:()=>me});module.exports=Se(ge);var s=require("@raycast/api"),ae=require("react");var J=require("react");var g=require("@raycast/api"),z=require("child_process"),K=require("crypto"),m=require("fs"),X=require("path");var M=e=>{let t=Math.floor(e/3600),n=String(Math.floor(e%3600/60)).padStart(2,"0"),i=String(Math.floor(e%60)).padStart(2,"0");return`${t===0?"":t+":"}${n}:${i}`},G=e=>{let t=new Date(e),n=[t.getFullYear().toString(),t.getMonth().toString().padStart(2,"0"),t.getDate().toString().padStart(2,"0")],i=[t.getHours(),t.getMinutes(),t.getSeconds()].map(l=>l.toString().padStart(2,"0")),a=n.join("-"),f=i.join(":");return`${a} ${f}`},H=e=>(e.d1=e.d1=="----"?void 0:e.d1,e.d2=e.d2=="----"?void 0:e.d2,Math.round((e.d1?new Date(e.d1):new Date).getTime()-(e.d2?new Date(e.d2):new Date).getTime())/1e3);var w=require("@raycast/api");var $=e=>{let t=(0,w.getPreferenceValues)();if(e.launchedFromMenuBar||t.closeWindowOnTimerStart){let n=e.isErr?"\u26A0\uFE0F":"\u{1F389}";return(0,w.showHUD)(`${n} ${e.msg}`),(0,w.popToRoot)()}else(0,w.showToast)({style:e.isErr?w.Toast.Style.Failure:w.Toast.Style.Success,title:e.msg})};var y=g.environment.supportPath+"/customTimers.json",Pe=g.environment.supportPath+"/defaultPresetVisibles.json",Q=e=>{try{(0,m.unlinkSync)(e)}catch(t){if(t instanceof Error&&!t.message.includes("ENOENT"))throw t}},A=(e=!1)=>{let t=(0,g.getPreferenceValues)();return parseFloat(t.volumeSetting)>5?($({msg:"Timer alert volume should not be louder than 5 (it can get quite loud!)",launchedFromMenuBar:e,isErr:!0}),!1):!0};async function O({timeInSeconds:e,timerName:t="Untitled",launchedFromMenuBar:n=!1,selectedSound:i="default"}){let f=(g.environment.supportPath+"/"+new Date().toISOString()+"---"+e+".timer").replace(/:/g,"__");(0,m.writeFileSync)(f,t);let l=(0,g.getPreferenceValues)(),E=`${g.environment.assetsPath+"/"+(i==="default"?l.selectedSound:i)}`,S=[`sleep ${e}`];S.push(`if [ -f "${f}" ]; then osascript -e 'display notification "Timer \\"${t}\\" complete" with title "Ding!"'`);let N=`afplay "${E}" --volume ${l.volumeSetting.replace(",",".")}`;if(l.selectedSound==="speak_timer_name"?S.push(`say "${t}"`):S.push(N),l.ringContinuously){let T=`${f}`.replace(".timer",".dismiss");(0,m.writeFileSync)(T,".dismiss file for Timers"),S.push(`while [ -f "${T}" ]; do ${N}; done`)}S.push(`rm "${f}"; else echo "Timer deleted"; fi`),(0,z.exec)(S.join(" && "),(T,F)=>{if(T){console.log(`error: ${T.message}`);return}if(F){console.log(`stderr: ${F}`);return}}),$({msg:`Timer "${t}" started for ${M(e)}!`,launchedFromMenuBar:n,isErr:!1})}function Z(e){let t=g.environment.supportPath+"/"+e,n=t.replace(".timer",".dismiss");Q(t),Q(n)}function ee(){let e=[];return(0,m.readdirSync)(g.environment.supportPath).forEach(n=>{if((0,X.extname)(n)==".timer"){let i={name:"",secondsSet:-99,timeLeft:-99,originalFile:n,timeEnds:new Date};i.name=(0,m.readFileSync)(g.environment.supportPath+"/"+n).toString();let a=n.split("---");i.secondsSet=Number(a[1].split(".")[0]);let f=a[0].replace(/__/g,":");i.timeLeft=Math.max(0,Math.round(i.secondsSet-H({d2:f}))),i.timeEnds=new Date(f),i.timeEnds.setSeconds(i.timeEnds.getSeconds()+i.secondsSet),e.push(i)}}),e.sort((n,i)=>n.timeLeft-i.timeLeft),e}function te(e,t){let n=g.environment.supportPath+"/"+e;(0,m.writeFileSync)(n,t)}function b(){(0,m.existsSync)(y)||(0,m.writeFileSync)(y,JSON.stringify({}))}function R(e){b();let t=JSON.parse((0,m.readFileSync)(y,"utf8"));t[(0,K.randomUUID)()]=e,(0,m.writeFileSync)(y,JSON.stringify(t))}function V(){b();let e=JSON.parse((0,m.readFileSync)(y,"utf8"));return Object.fromEntries(Object.entries(e).map(([t,n])=>n.showInMenuBar===void 0?[t,{...n,showInMenuBar:!0}]:[t,n]))}function ne(e,t){b();let n=JSON.parse((0,m.readFileSync)(y,"utf8"));n[e].name=t,(0,m.writeFileSync)(y,JSON.stringify(n))}function re(e){b();let t=JSON.parse((0,m.readFileSync)(y,"utf8"));delete t[e],(0,m.writeFileSync)(y,JSON.stringify(t))}function oe(e){b();let t=JSON.parse((0,m.readFileSync)(y,"utf8")),n=t[e].showInMenuBar;t[e].showInMenuBar=n===void 0?!1:!n,(0,m.writeFileSync)(y,JSON.stringify(t))}var I=require("@raycast/api");function W(){let[e,t]=(0,J.useState)(void 0),[n,i]=(0,J.useState)({}),[a,f]=(0,J.useState)(e===void 0),l=()=>{b();let r=ee();t(r);let u=V();i(u),f(!1)};return{timers:e,customTimers:n,isLoading:a,refreshTimers:l,handleStartTimer:r=>{A(r.launchedFromMenuBar)&&(O(r),l())},handleStopTimer:r=>{t(e?.filter(u=>u.originalFile!==r.originalFile)),Z(r.originalFile),l()},handleStartCT:({customTimer:r,launchedFromMenuBar:u})=>{A(u)&&(O({timeInSeconds:r.timeInSeconds,launchedFromMenuBar:u,timerName:r.name,selectedSound:r.selectedSound}),l())},handleCreateCT:r=>{let u={name:r.name,timeInSeconds:r.secondsSet,selectedSound:"default",showInMenuBar:!0};R(u),l()},handleDeleteCT:async r=>{let u={title:"Delete this preset?",icon:I.Icon.Trash,message:"You won't be able to recover it.",dismissAction:{title:"Cancel",style:I.Alert.ActionStyle.Cancel},primaryAction:{title:"Delete",style:I.Alert.ActionStyle.Destructive}};await(0,I.confirmAlert)(u)&&(re(r),l())},handleToggleCTVisibility:async r=>{oe(r),l()}}}var p=require("@raycast/api");var j=require("@raycast/api");var P=require("fs");var L=j.environment.supportPath+"/raycast-stopwatches.json",he=()=>{(!(0,P.existsSync)(L)||(0,P.readFileSync)(L).toString()=="")&&(0,P.writeFileSync)(L,"[]")};var se=(e,t)=>{he();let i=JSON.parse((0,P.readFileSync)(L,"utf8")).map(a=>a.swID==e?{...a,name:t}:a);(0,P.writeFileSync)(L,JSON.stringify(i))};var k=require("react/jsx-runtime");function x(e){let t=n=>{if(n===""||n===e.currentName)new p.Toast({style:p.Toast.Style.Failure,title:"No new name given!"}).show();else{switch((0,p.popToRoot)(),e.originalFile){case"customTimer":ne(e.ctID?e.ctID:"-99",n);break;case"stopwatch":se(e.ctID?e.ctID:"-99",n);break;default:te(e.originalFile,n);break}new p.Toast({style:p.Toast.Style.Success,title:`Renamed to ${n}!`}).show()}};return(0,k.jsx)(p.Form,{actions:(0,k.jsx)(p.ActionPanel,{children:(0,k.jsx)(p.Action.SubmitForm,{title:"Rename",onSubmit:n=>t(n.newName)})}),children:(0,k.jsx)(p.Form.TextField,{id:"newName",title:"New name",placeholder:e.currentName})})}var d=require("@raycast/api"),B=require("react");var D=require("@raycast/api"),ie=[{title:"Alarm Clock",icon:D.Icon.Alarm,value:"alarmClock.wav"},{title:"Dismembered Woodpecker",icon:D.Icon.Bird,value:"dismemberedWoodpecker.wav"},{title:"Flute Riff",icon:D.Icon.Music,value:"fluteRiff.wav"},{title:"Level Up",icon:D.Icon.Trophy,value:"levelUp.wav"},{title:"Piano Chime",icon:D.Icon.Music,value:"pianoChime.wav"},{title:"Terminator",icon:D.Icon.BarCode,value:"terminator.wav"},{title:"Speak Timer Name",icon:D.Icon.Person,value:"speak_timer_name"}];var C=require("react/jsx-runtime");function Y(e){let t=Object.values(e.arguments).some(o=>o!==""),[n,i]=(0,B.useState)(),[a,f]=(0,B.useState)(),[l,E]=(0,B.useState)(),S=(0,d.getPreferenceValues)(),N=o=>{if(b(),o.hours===""&&o.minutes===""&&o.seconds==="")new d.Toast({style:d.Toast.Style.Failure,title:"No values set for timer length!"}).show();else if(isNaN(Number(o.hours)))i("Hours must be a number!");else if(isNaN(Number(o.minutes)))f("Minutes must be a number!");else if(isNaN(Number(o.seconds)))E("Seconds must be a number!");else{if(!A())return;(0,d.closeMainWindow)();let h=o.name?o.name:"Untitled",q=3600*Number(o.hours)+60*Number(o.minutes)+Number(o.seconds);O({timeInSeconds:q,timerName:h,selectedSound:o.selectedSound}),o.willBeSaved&&R({name:o.name,timeInSeconds:q,selectedSound:o.selectedSound,showInMenuBar:!0})}},T=()=>{n&&n.length>0&&i(void 0)},F=()=>{a&&a.length>0&&f(void 0)},v=()=>{l&&l.length>0&&E(void 0)},U=[{id:"hours",title:"Hours",placeholder:"0",err:n,drop:T,validator:o=>{let h=o.target.value;isNaN(Number(h))?i("Hours must be a number!"):T()}},{id:"minutes",title:"Minutes",placeholder:"00",err:a,drop:F,validator:o=>{let h=o.target.value;isNaN(Number(h))?f("Minutes must be a number!"):F()}},{id:"seconds",title:"Seconds",placeholder:"00",err:l,drop:v,validator:o=>{let h=o.target.value;isNaN(Number(h))?E("Seconds must be a number!"):v()}}];return S.newTimerInputOrder!=="hhmmss"&&U.reverse(),(0,C.jsxs)(d.Form,{actions:(0,C.jsx)(d.ActionPanel,{children:(0,C.jsx)(d.Action.SubmitForm,{title:"Start Custom Timer",onSubmit:o=>N(o)})}),children:[U.map((o,h)=>(0,C.jsx)(d.Form.TextField,{id:o.id,title:o.title,placeholder:o.placeholder,defaultValue:e.arguments[o.id],error:o.err,onChange:o.drop,onBlur:o.validator},h)),(0,C.jsxs)(d.Form.Dropdown,{id:"selectedSound",defaultValue:"default",title:"Sound",children:[(0,C.jsx)(d.Form.Dropdown.Item,{value:"default",title:"Default"}),ie.map((o,h)=>(0,C.jsx)(d.Form.Dropdown.Item,{title:o.value===S.selectedSound?`${o.title} (currently selected)`:o.title,value:o.value,icon:o.icon},h))]}),(0,C.jsx)(d.Form.TextField,{id:"name",title:"Name",placeholder:"Pour Tea",autoFocus:t}),(0,C.jsx)(d.Form.Checkbox,{id:"willBeSaved",label:"Save as preset"})]})}var c=require("react/jsx-runtime");function me(e){if(e.launchContext?.timerID){let u=V()[e.launchContext.timerID];if(u==null)(0,s.showToast)({style:s.Toast.Style.Failure,title:"This custom timer no longer exists!"});else{O({timeInSeconds:u.timeInSeconds,timerName:u.name,selectedSound:u.selectedSound});return}}let{timers:t,customTimers:n,isLoading:i,refreshTimers:a,handleStopTimer:f,handleStartCT:l,handleCreateCT:E,handleDeleteCT:S}=W(),{push:N}=(0,s.useNavigation)();(0,ae.useEffect)(()=>{a(),setInterval(()=>{a()},1e3)},[]);let T={tag:{value:"Running",color:s.Color.Yellow}},F={tag:{value:"Finished!",color:s.Color.Green}},v=r=>`raycast://extensions/ThatNerd/timers/manageTimers?context=${encodeURIComponent(JSON.stringify({timerID:r}))}`;return(0,c.jsxs)(s.List,{isLoading:i,children:[(0,c.jsxs)(s.List.Section,{title:t?.length!==0&&t!=null?"Currently Running":"No Timers Running",children:[t?.map(r=>(0,c.jsx)(s.List.Item,{icon:{source:s.Icon.Clock,tintColor:r.timeLeft===0?s.Color.Green:s.Color.Yellow},title:r.name,subtitle:M(r.timeLeft)+" left",accessories:[{text:M(r.secondsSet)+" originally"},{text:`${r.timeLeft===0?"Ended":"Ends"} at ${G(r.timeEnds)}`},r.timeLeft===0?F:T],actions:(0,c.jsxs)(s.ActionPanel,{children:[(0,c.jsx)(s.Action,{title:"Stop Timer",onAction:()=>f(r)}),(0,c.jsx)(s.Action,{title:"Rename Timer",onAction:()=>N((0,c.jsx)(x,{currentName:r.name,originalFile:r.originalFile,ctID:null}))}),(0,c.jsx)(s.Action,{title:"Save Timer as Preset",shortcut:{modifiers:["cmd","shift"],key:"enter"},onAction:()=>E(r)})]})},r.originalFile)),(0,c.jsx)(s.List.Item,{icon:s.Icon.Clock,title:"Create a new timer",subtitle:"Press Enter to start a timer",actions:(0,c.jsx)(s.ActionPanel,{children:(0,c.jsx)(s.Action,{title:"Start Timer",onAction:()=>N((0,c.jsx)(Y,{arguments:{hours:"",minutes:"",seconds:""}}))})})},0)]}),(0,c.jsx)(s.List.Section,{title:"Custom Timers",children:Object.keys(n)?.sort((r,u)=>n[r].timeInSeconds-n[u].timeInSeconds).map(r=>(0,c.jsx)(s.List.Item,{icon:s.Icon.Clock,title:n[r].name,subtitle:M(n[r].timeInSeconds),actions:(0,c.jsxs)(s.ActionPanel,{children:[(0,c.jsx)(s.Action,{title:"Start Timer",onAction:()=>l({customTimer:n[r]})}),(0,c.jsx)(s.Action,{title:"Rename Timer",onAction:()=>N((0,c.jsx)(x,{currentName:n[r].name,originalFile:"customTimer",ctID:r}))}),(0,c.jsx)(s.Action,{title:"Delete Custom Timer",shortcut:{modifiers:["ctrl"],key:"x"},onAction:()=>S(r)}),(0,c.jsx)(s.Action.CreateQuicklink,{quicklink:{name:n[r].name,link:v(r)},title:"Add Preset to Root Search"})]})},r))})]})}
