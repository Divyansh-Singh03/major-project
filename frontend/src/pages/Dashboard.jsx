import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { getPortfolio, setAuthToken, deleteHolding } from "../api";
import AddStockForm from "../components/AddStockForm";

const PREDICTION_API =
  "https://rohan72-nse-stock-direction-predictor.hf.space";

const COLORS = ["#22c55e","#6366f1","#f59e0b","#f87171","#38bdf8","#a78bfa","#34d399","#fb923c"];
function sym(currency) { return currency === "INR" ? "₹" : "$"; }
function fmtNum(n, d=2) { return parseFloat(n||0).toLocaleString("en-IN",{minimumFractionDigits:d}); }

const navItems = [
  { label:"Dashboard", icon:<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
  { label:"Portfolio", icon:<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
  { label:"Analytics", icon:<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { label:"Predictions", icon:<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { label:"Settings", icon:<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
];

function MiniChart({ color, up }) {
  return (
    <svg width="80" height="36" viewBox="0 0 80 36">
      <defs><linearGradient id={"g"+color.replace("#","")} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.35"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      {up?<><path d="M0 28 C10 26 20 20 30 16 C40 12 50 18 60 10 C65 7 72 4 80 2" stroke={color} strokeWidth="2" fill="none"/><path d="M0 28 C10 26 20 20 30 16 C40 12 50 18 60 10 C65 7 72 4 80 2 L80 36 L0 36Z" fill={"url(#g"+color.replace("#","")+")"}/></>:<><path d="M0 6 C10 8 20 12 30 18 C40 24 50 18 60 24 C68 28 74 30 80 33" stroke={color} strokeWidth="2" fill="none"/><path d="M0 6 C10 8 20 12 30 18 C40 24 50 18 60 24 C68 28 74 30 80 33 L80 36 L0 36Z" fill={"url(#g"+color.replace("#","")+")"}/></>}
    </svg>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return <div style={{background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#f1f5f9",boxShadow:"0 8px 24px #00000099"}}><div style={{fontWeight:700,fontSize:14,color:"#22c55e"}}>{Number(payload[0].value).toLocaleString("en-IN",{minimumFractionDigits:2})}</div><div style={{color:"#64748b",marginTop:3}}>{label}</div></div>;
};

function StatsBar({ stats }) {
  const profit=parseFloat(stats.profit), isUp=profit>=0;
  const mainSym=stats.primaryCurrency==="INR"?"₹":stats.primaryCurrency==="USD"?"$":"~";
  const c={borderRadius:16,padding:"20px 24px",position:"relative",overflow:"hidden",display:"flex",justifyContent:"space-between",alignItems:"flex-start"};
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
      <div style={{...c,background:"linear-gradient(135deg,#0f2618,#0d1f14)",border:"1px solid #1a3a25"}}>
        <div>
          <p style={{margin:0,fontSize:12,color:"#6b9e7a",fontWeight:500,marginBottom:8}}>Total Portfolio Value {stats.hasMixedCurrencies&&<span style={{color:"#f59e0b",fontSize:10}}>※ mixed</span>}</p>
          <h2 style={{margin:0,fontSize:24,fontWeight:800,color:"#f1f5f9",letterSpacing:-0.5}}>{mainSym}{fmtNum(stats.currentValue)}</h2>
          <p style={{margin:"6px 0 0",fontSize:12,color:"#22c55e",fontWeight:500}}>{isUp?"+":""}{stats.percent}%</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
          <div style={{background:"#22c55e22",borderRadius:10,padding:"7px 8px"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
          <MiniChart color="#22c55e" up={true}/>
        </div>
      </div>
      <div style={{...c,background:"linear-gradient(135deg,#0f2618,#0d1f14)",border:"1px solid #1a3a25"}}>
        <div>
          <p style={{margin:0,fontSize:12,color:"#6b9e7a",fontWeight:500,marginBottom:8}}>Profit / Loss</p>
          <h2 style={{margin:0,fontSize:24,fontWeight:800,color:isUp?"#22c55e":"#f87171",letterSpacing:-0.5}}>{isUp?"+":""}{mainSym}{fmtNum(Math.abs(profit))}</h2>
          <p style={{margin:"6px 0 0",fontSize:12,color:isUp?"#22c55e":"#f87171",fontWeight:500}}>({isUp?"+":""}{stats.percent}%)</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
          <div style={{background:isUp?"#22c55e22":"#f8717122",borderRadius:10,padding:"7px 8px"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isUp?"#22c55e":"#f87171"} strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg></div>
          <MiniChart color={isUp?"#22c55e":"#f87171"} up={isUp}/>
        </div>
      </div>
      <div style={{...c,background:"linear-gradient(135deg,#1a0e0e,#150b0b)",border:"1px solid #3a1a1a"}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:20,marginBottom:8}}><p style={{margin:0,fontSize:12,color:"#9e6b6b",fontWeight:500}}>Total Invested</p><p style={{margin:0,fontSize:12,color:"#9e6b6b",fontWeight:500}}>Current Value</p></div>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{fontSize:16,fontWeight:800,color:"#f1f5f9"}}>{mainSym}{fmtNum(stats.totalInvested)}</span>
            <span style={{color:"#475569",fontSize:13}}>vs</span>
            <span style={{fontSize:16,fontWeight:800,color:"#22c55e"}}>{mainSym}{fmtNum(stats.currentValue)}</span>
          </div>
          <p style={{margin:"8px 0 0",fontSize:11,color:"#6b7280"}}>🏆 Best: <strong style={{color:"#fbbf24"}}>{stats.bestStock.name}</strong> • {stats.bestStock.return}% return</p>
        </div>
      </div>
    </div>
  );
}

function generateFallback(avgPrice, currentPrice, timeframe) {
  const n = {
  "1D": 24,
  "5D": 30,
  "1M": 30,
  "3M": 45,
  "6M": 36
}[timeframe] || 30;
  const labels={"1D":(i)=>`${i}:00`,"5D":(i)=>`Day ${i+1}`,"1M":(i)=>`${i+1}`,"3M":(i)=>`W${i+1}`,"6M":(i)=>`M${Math.ceil((i+1)/6)}`};
  const labelFn=labels[timeframe]||((i)=>`${i+1}`);
  let price=avgPrice;
  const vol=Math.abs(currentPrice-avgPrice)/n*0.5+avgPrice*0.006;
  const data=[];
  for(let i=0;i<n;i++){const pull=(currentPrice-price)/(n-i);price+=pull+(Math.random()-0.48)*vol;price=Math.max(price,avgPrice*0.4);data.push({label:labelFn(i),price:parseFloat(price.toFixed(2))});}
  if(data.length)data[data.length-1].price=parseFloat(currentPrice.toFixed(2));
  return data;
}

function ChartPanel({ pieData=[], holdings=[] }) {
  const [selectedIdx,setSelectedIdx]=useState(0);
  const [timeframe,setTimeframe]=useState("1M");
  const [chartData,setChartData]=useState([]);
  const [loading,setLoading]=useState(false);
  const [dataSource,setDataSource]=useState("");
  const tfs=["1D","5D","1M","3M","6M"];
  const selectedStock=pieData[selectedIdx];
  const holding=useMemo(()=>holdings.find(h=>h.symbol===selectedStock?.name),[selectedStock,holdings]);
  const avgPrice=holding?.avg_buy_price||100;

  useEffect(()=>{
    if(!selectedStock?.name)return;
    setLoading(true);setChartData([]);setDataSource("");
    const symbol=holding?.yahooSymbol||selectedStock.name;
    Promise.all([
      axios.get(`/api/stocks/history/${encodeURIComponent(symbol)}?timeframe=${timeframe}`).then(r=>r.data?.candles||[]).catch(()=>[]),
      Promise.resolve(holding?.current||0),
    ]).then(([candles,live])=>{
      if(candles.length>0){setChartData(candles);setDataSource("yahoo");}
      else{const p=live>0?live:avgPrice;setChartData(generateFallback(avgPrice,p,timeframe));setDataSource("simulated");}
    }).finally(()=>setLoading(false));
  },[selectedStock?.name,timeframe]);

  const firstVal=chartData[0]?.price||0,lastVal=chartData[chartData.length-1]?.price||0;
  const isUp=lastVal>=firstVal,chartColor=isUp?"#22c55e":"#f87171";
  const changePct=firstVal>0?(((lastVal-firstVal)/firstVal)*100).toFixed(2):"0.00";
  const changeAbs=(lastVal-firstVal).toFixed(2);

  return (
    <div style={{background:"#0d1623",border:"1px solid #1a2540",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #1a2540"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{background:"#131f35",border:"1px solid #1e2d4a",borderRadius:10,padding:"6px 14px",display:"flex",alignItems:"center",gap:8}}>
            {selectedStock&&<span style={{width:8,height:8,borderRadius:"50%",background:COLORS[selectedIdx%COLORS.length],display:"inline-block"}}/>}
            <span style={{fontSize:14,fontWeight:700,color:"#f1f5f9"}}>{selectedStock?.name||"—"}</span>
          </div>
          {!loading&&chartData.length>0&&<div>
            <div style={{fontSize:14,fontWeight:700,color:"#f1f5f9"}}>₹{lastVal.toLocaleString("en-IN",{minimumFractionDigits:2})}</div>
            <div style={{fontSize:11,color:isUp?"#22c55e":"#f87171",fontWeight:600}}>{isUp?"▲":"▼"} {isUp?"+":""}{changeAbs} ({isUp?"+":""}{changePct}%)
              {dataSource==="yahoo"&&<span style={{marginLeft:6,color:"#22c55e88",fontSize:10}}>● live</span>}
              {dataSource==="simulated"&&<span style={{marginLeft:6,color:"#f59e0b88",fontSize:10}}>~ est.</span>}
            </div>
          </div>}
        </div>
        <div style={{display:"flex",background:"#131f35",borderRadius:8,padding:3,gap:2}}>
          {tfs.map(tf=><button key={tf} onClick={()=>setTimeframe(tf)} style={{padding:"5px 11px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,transition:"all 0.15s",fontFamily:"inherit",background:timeframe===tf?"#22c55e":"transparent",color:timeframe===tf?"white":"#64748b"}}>{tf}</button>)}
        </div>
      </div>
      <div style={{padding:"16px 8px 4px",flex:1,minHeight:240}}>
        {loading?<div style={{height:230,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:10}}><div style={{width:26,height:26,border:"3px solid #1a2540",borderTop:"3px solid #22c55e",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><span style={{color:"#475569",fontSize:13}}>Loading chart...</span></div>
        :chartData.length===0?<div style={{height:230,display:"flex",alignItems:"center",justifyContent:"center",color:"#475569",fontSize:13}}>{pieData.length===0?"Add stocks to see chart":"No data available"}</div>
        :<ResponsiveContainer width="100%" height={230}><AreaChart data={chartData} margin={{top:8,right:10,left:0,bottom:0}}><defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chartColor} stopOpacity="0.4"/><stop offset="85%" stopColor={chartColor} stopOpacity="0.03"/></linearGradient></defs><CartesianGrid stroke="#1a2540" strokeDasharray="4 4" vertical={false}/><XAxis dataKey="label" stroke="#1e2d4a" tick={{fill:"#475569",fontSize:10}} axisLine={false} tickLine={false} interval={Math.max(0,Math.floor(chartData.length/7))}/><YAxis stroke="#1e2d4a" tick={{fill:"#475569",fontSize:10}} axisLine={false} tickLine={false} width={58} tickFormatter={v=>`₹${v}`} domain={["auto","auto"]}/><Tooltip content={<CustomTooltip/>}/><Area type="monotone" dataKey="price" stroke={chartColor} strokeWidth={2.5} fill="url(#areaGrad)" dot={false} activeDot={{r:5,fill:chartColor,stroke:"#0d1623",strokeWidth:2}}/></AreaChart></ResponsiveContainer>}
      </div>
      {pieData.length>0&&<div style={{padding:"10px 20px 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
        {pieData.map((d,i)=><button key={d.name} onClick={()=>setSelectedIdx(i)} style={{background:selectedIdx===i?COLORS[i%COLORS.length]+"22":"#131f35",border:`1px solid ${selectedIdx===i?COLORS[i%COLORS.length]:"#1e2d4a"}`,borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:600,color:selectedIdx===i?COLORS[i%COLORS.length]:"#64748b",cursor:"pointer",transition:"all 0.15s",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}><span style={{width:7,height:7,borderRadius:"50%",background:COLORS[i%COLORS.length],display:"inline-block"}}/>{d.name}</button>)}
      </div>}
    </div>
  );
}

function HoldingsTable({ holdings, onRefresh }) {
  const [showForm,setShowForm]=useState(false);
  const [deleting,setDeleting]=useState(null);
  async function handleDelete(id){if(!confirm("Delete this holding?"))return;setDeleting(id);try{const{data}=await deleteHolding(id);if(onRefresh)onRefresh(data);}catch{alert("Delete failed");}finally{setDeleting(null);}}
  return (
    <div style={{background:"#0d1623",border:"1px solid #1a2540",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"18px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #1a2540"}}>
        <h3 style={{margin:0,fontSize:15,fontWeight:700,color:"#f1f5f9"}}>Stock Holdings</h3>
        <button onClick={()=>setShowForm(s=>!s)} style={{background:showForm?"#22c55e":"#131f35",border:`1px solid ${showForm?"#22c55e":"#1e2d4a"}`,borderRadius:8,padding:"5px 12px",color:showForm?"white":"#94a3b8",fontSize:12,cursor:"pointer",fontWeight:600,fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {showForm?"Close":"Add Stock"}
        </button>
      </div>
      {showForm&&<div style={{padding:"16px 22px",borderBottom:"1px solid #1a2540",background:"#0b1120"}}><AddStockForm onAdded={(data)=>{if(onRefresh)onRefresh(data);setShowForm(false);}}/></div>}
      <div style={{display:"grid",gridTemplateColumns:"1.3fr 0.6fr 0.9fr 0.9fr 0.9fr 0.85fr",padding:"10px 22px",background:"#0b1120",borderBottom:"1px solid #1a2540"}}>
        {["Stock","Qty","Avg Price","Cur. Price","Value","Gain/Loss"].map(h=><span key={h} style={{fontSize:10,color:"#475569",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{h}</span>)}
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {holdings.length===0?<div style={{padding:"40px 22px",textAlign:"center",color:"#475569",fontSize:13}}>No holdings yet. Add your first stock!</div>
        :holdings.map((h,idx)=>{
          const curPrice=h.current||h.avg_buy_price,value=curPrice*h.shares;
          const pct=((curPrice-h.avg_buy_price)/h.avg_buy_price)*100,isUp=pct>=0;
          const s=sym(h.currency),isIN=h.market==="IN"||h.currency==="INR";
          return <div key={h._id||h.symbol} style={{display:"grid",gridTemplateColumns:"1.3fr 0.6fr 0.9fr 0.9fr 0.9fr 0.85fr",padding:"13px 22px",borderBottom:"1px solid #0f1a2e",alignItems:"center",transition:"background 0.15s",background:idx%2===0?"transparent":"#0b1120"}} onMouseEnter={e=>e.currentTarget.style.background="#131f3566"} onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"transparent":"#0b1120"}>
            <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontWeight:700,fontSize:13,color:"#f1f5f9"}}>{h.symbol}</span><span style={{fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:10,background:isIN?"#f59e0b22":"#3b82f622",color:isIN?"#f59e0b":"#60a5fa"}}>{isIN?"NSE":"US"}</span></div>
            <span style={{fontSize:12,color:"#cbd5e1"}}>{h.shares}</span>
            <span style={{fontSize:12,color:"#cbd5e1"}}>{s}{parseFloat(h.avg_buy_price).toFixed(2)}</span>
            <span style={{fontSize:12,color:"#cbd5e1"}}>{s}{curPrice.toFixed(2)}</span>
            <span style={{fontSize:12,color:"#cbd5e1"}}>{s}{value.toFixed(2)}</span>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:12,fontWeight:700,color:isUp?"#22c55e":"#f87171"}}>{isUp?"+":""}{pct.toFixed(2)}%</span>
              <button onClick={()=>handleDelete(h._id)} disabled={deleting===h._id} style={{background:"transparent",border:"none",cursor:"pointer",color:"#374151",fontSize:11,padding:"2px 4px",borderRadius:4,transition:"color 0.2s"}} onMouseEnter={e=>e.currentTarget.style.color="#f87171"} onMouseLeave={e=>e.currentTarget.style.color="#374151"}>{deleting===h._id?"...":"✕"}</button>
            </div>
          </div>;
        })}
      </div>
    </div>
  );
}

function AnalyticsPage({ holdings, stats }) {
  const mainSym=stats.primaryCurrency==="INR"?"₹":stats.primaryCurrency==="USD"?"$":"~";
  const pieData=holdings.map((h,i)=>({name:h.symbol,value:Math.round((h.current||h.avg_buy_price)*h.shares),color:COLORS[i%COLORS.length]}));
  const barData=holdings.map(h=>{const cur=h.current||h.avg_buy_price,pct=h.avg_buy_price>0?((cur-h.avg_buy_price)/h.avg_buy_price)*100:0;return{symbol:h.symbol,gain:parseFloat(pct.toFixed(2)),value:parseFloat((cur*h.shares).toFixed(2))};});
  const usH=holdings.filter(h=>h.market!=="IN"&&h.currency!=="INR"),inH=holdings.filter(h=>h.market==="IN"||h.currency==="INR");
  const usV=usH.reduce((s,h)=>s+(h.current||h.avg_buy_price)*h.shares,0),inV=inH.reduce((s,h)=>s+(h.current||h.avg_buy_price)*h.shares,0);
  const totalV=usV+inV;
  const sorted=[...holdings].map(h=>{const cur=h.current||h.avg_buy_price,pct=h.avg_buy_price>0?((cur-h.avg_buy_price)/h.avg_buy_price)*100:0;return{...h,pct};}).sort((a,b)=>b.pct-a.pct);
  const winners=sorted.filter(h=>h.pct>=0),losers=sorted.filter(h=>h.pct<0).reverse();
  const card={background:"#0d1623",border:"1px solid #1a2540",borderRadius:16,padding:"22px",overflow:"hidden"};
  if(holdings.length===0)return<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:400,gap:16}}><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg><p style={{color:"#475569",fontSize:14}}>Add holdings to see analytics</p></div>;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div style={card}>
          <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:700,color:"#f1f5f9"}}>Portfolio Allocation</h3>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <ResponsiveContainer width={200} height={200}><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">{pieData.map((e,i)=><Cell key={i} fill={e.color} stroke="transparent"/>)}</Pie><Tooltip formatter={(v)=>[`${mainSym}${fmtNum(v)}`,"Value"]}/></PieChart></ResponsiveContainer>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {pieData.map(d=>{const pct=totalV>0?((d.value/totalV)*100).toFixed(1):0;return<div key={d.name} style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:10,height:10,borderRadius:"50%",background:d.color,flexShrink:0}}/><span style={{fontSize:12,color:"#cbd5e1",fontWeight:600}}>{d.name}</span><span style={{fontSize:11,color:"#475569",marginLeft:"auto"}}>{pct}%</span></div>;})}
            </div>
          </div>
        </div>
        <div style={card}>
          <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:700,color:"#f1f5f9"}}>Market Exposure</h3>
          {[{label:"🇺🇸 US Markets",val:usV,total:totalV,color:"linear-gradient(90deg,#3b82f6,#6366f1)",textColor:"#60a5fa",count:usH.length,prefix:"$"},
            {label:"🇮🇳 Indian Markets",val:inV,total:totalV,color:"linear-gradient(90deg,#f59e0b,#f97316)",textColor:"#f59e0b",count:inH.length,prefix:"₹"}].map(m=>(
            <div key={m.label} style={{marginBottom:18}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:12,color:m.textColor,fontWeight:600}}>{m.label}</span><span style={{fontSize:12,color:"#94a3b8"}}>{totalV>0?((m.val/totalV)*100).toFixed(1):0}%</span></div>
              <div style={{height:8,background:"#0b1120",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${totalV>0?(m.val/totalV)*100:0}%`,background:m.color,borderRadius:4,transition:"width 0.8s ease"}}/></div>
              <div style={{fontSize:11,color:"#475569",marginTop:5}}>{m.prefix}{fmtNum(m.val)} across {m.count} stock{m.count!==1?"s":""}</div>
            </div>
          ))}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:6}}>
            {[{label:"Total Holdings",value:holdings.length},{label:"Diversification",value:holdings.length>=5?"Good ✓":"Low ⚠"},{label:"Best Performer",value:sorted[0]?.symbol||"—"},{label:"Worst Performer",value:sorted[sorted.length-1]?.symbol||"—"}].map(item=>(
              <div key={item.label} style={{background:"#0b1120",borderRadius:10,padding:"10px 12px"}}>
                <div style={{fontSize:10,color:"#475569",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>{item.label}</div>
                <div style={{fontSize:13,color:"#f1f5f9",fontWeight:700}}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={card}>
        <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:700,color:"#f1f5f9"}}>Return % per Stock</h3>
        <ResponsiveContainer width="100%" height={200}><BarChart data={barData} margin={{top:0,right:10,left:0,bottom:0}}><CartesianGrid stroke="#1a2540" strokeDasharray="4 4" vertical={false}/><XAxis dataKey="symbol" stroke="#1e2d4a" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/><YAxis stroke="#1e2d4a" tick={{fill:"#475569",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/><Tooltip formatter={(v)=>[`${v}%`,"Return"]} contentStyle={{background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:8,color:"#f1f5f9",fontSize:12}}/><Bar dataKey="gain" radius={[6,6,0,0]}>{barData.map((e,i)=><Cell key={i} fill={e.gain>=0?"#22c55e":"#f87171"}/>)}</Bar></BarChart></ResponsiveContainer>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div style={card}>
          <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700,color:"#22c55e"}}>🏆 Top Winners</h3>
          {winners.length===0?<p style={{color:"#475569",fontSize:13}}>No winning positions yet</p>
          :winners.map((h,i)=><div key={h.symbol} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<winners.length-1?"1px solid #0f1a2e":"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{width:28,height:28,borderRadius:8,background:"#22c55e18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#22c55e"}}>{i+1}</span>
              <div><div style={{fontSize:13,fontWeight:700,color:"#f1f5f9"}}>{h.symbol}</div><div style={{fontSize:11,color:"#475569"}}>{sym(h.currency)}{parseFloat(h.avg_buy_price).toFixed(2)} → {sym(h.currency)}{(h.current||h.avg_buy_price).toFixed(2)}</div></div>
            </div>
            <span style={{fontSize:13,fontWeight:700,color:"#22c55e"}}>+{h.pct.toFixed(2)}%</span>
          </div>)}
        </div>
        <div style={card}>
          <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700,color:"#f87171"}}>📉 Underperformers</h3>
          {losers.length===0?<p style={{color:"#475569",fontSize:13}}>No losing positions — great job!</p>
          :losers.map((h,i)=><div key={h.symbol} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<losers.length-1?"1px solid #0f1a2e":"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{width:28,height:28,borderRadius:8,background:"#f8717118",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#f87171"}}>{i+1}</span>
              <div><div style={{fontSize:13,fontWeight:700,color:"#f1f5f9"}}>{h.symbol}</div><div style={{fontSize:11,color:"#475569"}}>{sym(h.currency)}{parseFloat(h.avg_buy_price).toFixed(2)} → {sym(h.currency)}{(h.current||h.avg_buy_price).toFixed(2)}</div></div>
            </div>
            <span style={{fontSize:13,fontWeight:700,color:"#f87171"}}>{h.pct.toFixed(2)}%</span>
          </div>)}
        </div>
      </div>
    </div>
  );
}

function PredictionsPage() {
  const [ticker, setTicker] = useState("TCS.NS");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const GROUPED_TICKERS = [
    { group: "Technology", tickers: ["TCS.NS","INFY.NS","HCLTECH.NS","WIPRO.NS"] },
    { group: "Finance",    tickers: ["HDFCBANK.NS","ICICIBANK.NS","SBIN.NS","KOTAKBANK.NS"] },
    { group: "Energy",     tickers: ["RELIANCE.NS","NTPC.NS","ONGC.NS"] },
    { group: "Pharma",     tickers: ["SUNPHARMA.NS","CIPLA.NS","DRREDDY.NS"] },
    { group: "Consumer",   tickers: ["HINDUNILVR.NS","ITC.NS","ASIANPAINT.NS"] },
    { group: "Industrial", tickers: ["LT.NS","ULTRACEMCO.NS","TATASTEEL.NS"] },
  ];
  const TICKER_NAMES = {
    "TCS.NS":"Tata Consultancy","INFY.NS":"Infosys","HCLTECH.NS":"HCL Technologies",
    "WIPRO.NS":"Wipro","HDFCBANK.NS":"HDFC Bank","ICICIBANK.NS":"ICICI Bank",
    "SBIN.NS":"State Bank of India","KOTAKBANK.NS":"Kotak Mahindra",
    "RELIANCE.NS":"Reliance Industries","NTPC.NS":"NTPC Ltd","ONGC.NS":"Oil & Natural Gas",
    "SUNPHARMA.NS":"Sun Pharma","CIPLA.NS":"Cipla","DRREDDY.NS":"Dr. Reddy's",
    "HINDUNILVR.NS":"HUL","ITC.NS":"ITC Ltd","ASIANPAINT.NS":"Asian Paints",
    "LT.NS":"Larsen & Toubro","ULTRACEMCO.NS":"UltraTech Cement","TATASTEEL.NS":"Tata Steel",
  };
  const HORIZON_LABELS = { r21:"1 Month", r63:"3 Months", r126:"6 Months" };
  const HORIZON_DAYS   = { r21:21, r63:63, r126:126 };

  async function runPrediction() {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await axios.post(`${PREDICTION_API}/simple/predict`, {
        api_key: "ibm3wO94lucLj6l4IXiDqBobcZil9BzC-gR9lC2N6Vo",
        ticker: ticker.trim().toUpperCase(),
      });
      
      console.log("API Response:", res.data); // <-- yeh dekh console mein
      
      const data = res.data;
      
      // Saare possible formats try kar
      if (data?.predictions?.r21) {
        setResult(data.predictions);
      } else if (data?.r21) {
        setResult(data);
      } else if (data?.result?.r21) {
        setResult(data.result);
      } else {
        // Jo bhi aaya usse dikhao debug ke liye
        console.error("Unknown format:", data);
        setError("Unexpected response format. Check console.");
      }
      
      setUpdatedAt(new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" }));
    } catch(e) {
      console.error("Prediction error:", e.response?.data || e.message);
      setError(e.response?.data?.detail || e.response?.data?.message || e.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  const card = { background:"#0d1623", border:"1px solid #1a2540", borderRadius:16, overflow:"hidden" };

  return (
    <div>
      {/* ── Selector Row ── */}
      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:24,flexWrap:"wrap"}}>
        <div style={{position:"relative"}}>
          <select
            value={ticker}
            onChange={e=>setTicker(e.target.value)}
            style={{background:"#131f35",border:"1px solid #1e2d4a",borderRadius:10,padding:"10px 36px 10px 14px",color:"#f1f5f9",fontSize:14,fontFamily:"inherit",outline:"none",cursor:"pointer",appearance:"none",minWidth:220}}
          >
            {GROUPED_TICKERS.map(grp=>(
              <optgroup key={grp.group} label={grp.group}>
                {grp.tickers.map(t=>(
                  <option key={t} value={t}>{t} — {TICKER_NAMES[t]}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <svg style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>

        <button
          onClick={runPrediction}
          disabled={loading}
          style={{background:"linear-gradient(135deg,#6366f1,#4f46e5)",border:"none",borderRadius:10,padding:"10px 22px",color:"white",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8,opacity:loading?0.6:1,transition:"opacity 0.2s"}}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          {loading?"Fetching...":"Predict"}
        </button>

        {result&&!loading&&(
          <button onClick={runPrediction} style={{background:"#131f35",border:"1px solid #1e2d4a",borderRadius:10,padding:"10px 16px",color:"#94a3b8",fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Refresh
          </button>
        )}

        {updatedAt&&(
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#475569"}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#6366f1",boxShadow:"0 0 6px #6366f1",display:"inline-block"}}/>
            Updated {updatedAt}
          </div>
        )}
      </div>

      {/* ── Empty State ── */}
      {!loading&&!result&&!error&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:380,gap:20}}>
          <div style={{width:80,height:80,borderRadius:20,background:"#131f35",border:"1px solid #1e2d4a",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <div style={{textAlign:"center"}}>
            <h2 style={{margin:"0 0 8px",fontSize:20,fontWeight:700,color:"#f1f5f9"}}>AI Predictions</h2>
            <p style={{margin:0,color:"#475569",fontSize:14}}>Select a stock and click Predict to get ML-powered forecasts</p>
          </div>
          <div style={{display:"flex",gap:10}}>
            {["21 days","63 days","126 days"].map(d=>(
              <span key={d} style={{background:"#131f35",border:"1px solid #1e2d4a",borderRadius:8,padding:"4px 14px",fontSize:11,color:"#6366f1",fontWeight:700}}>{d}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading State ── */}
      {loading&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:380,gap:16}}>
          <div style={{width:36,height:36,border:"3px solid #1a2540",borderTop:"3px solid #6366f1",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{fontSize:14,color:"#475569"}}>Running ML ensemble...</div>
          <div style={{fontSize:12,color:"#334155"}}>Transformer + LightGBM + Macro model</div>
        </div>
      )}

      {/* ── Error State ── */}
      {error&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:280,gap:14}}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div style={{fontSize:14,color:"#f87171",fontWeight:700}}>Prediction Failed</div>
          <div style={{fontSize:12,color:"#475569",maxWidth:300,textAlign:"center"}}>{error}</div>
          <button onClick={runPrediction} style={{background:"#131f35",border:"1px solid #1e2d4a",borderRadius:8,padding:"8px 18px",color:"#94a3b8",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Try Again</button>
        </div>
      )}

      {/* ── Results ── */}
      {result&&!loading&&(()=>{
        const horizons=["r21","r63","r126"];
        const curPrice=result[horizons[0]]?.current_price;
        const tickerShort=ticker.replace(".NS","");
        const sector={"Tech":"Technology","Finance":"Finance","Energy":"Energy","Pharma":"Pharma","Consumer":"Consumer","Industrial":"Industrial"}[
          GROUPED_TICKERS.find(g=>g.tickers.includes(ticker))?.group||""
        ]||"NSE";
        return (
          <div>
            {/* Header card */}
            <div style={{...card,marginBottom:16}}>
              <div style={{padding:"16px 22px",borderBottom:"1px solid #1a2540",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20,fontWeight:800,color:"#f1f5f9",letterSpacing:-0.3}}>{tickerShort}</span>
                  <span style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:20,background:"#6366f122",color:"#818cf8",border:"1px solid #6366f133"}}>{sector}</span>
                  <span style={{fontSize:11,color:"#475569"}}>NSE</span>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9"}}>₹{parseFloat(curPrice||0).toLocaleString("en-IN",{minimumFractionDigits:2})}</div>
                  <div style={{fontSize:11,color:"#475569",marginTop:2}}>Current price</div>
                </div>
              </div>

              {/* Horizons grid */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr"}}>
                {horizons.map((h,idx)=>{
                  const d=result[h]; if(!d) return null;
                  const isUp=d.direction==="UP";
                  const probPct=Math.round(d.prob_up*100);
                  const retStr=d.predicted_return>=0?`+${d.predicted_return.toFixed(2)}%`:`${d.predicted_return.toFixed(2)}%`;
                  const upColor="#22c55e"; const downColor="#f87171";
                  const dirColor=isUp?upColor:downColor;
                  const confColors={HIGH:{bg:"#22c55e18",color:"#22c55e",border:"#22c55e33"},MEDIUM:{bg:"#f59e0b18",color:"#f59e0b",border:"#f59e0b33"},LOW:{bg:"#47556922",color:"#94a3b8",border:"#1e2d4a"}};
                  const cc=confColors[d.confidence]||confColors.LOW;
                  return (
                    <div key={h} style={{padding:"20px 22px",borderRight:idx<2?"1px solid #1a2540":"none"}}>
                      <div style={{fontSize:10,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>
                        {HORIZON_LABELS[h]}
                        <span style={{background:"#131f35",border:"1px solid #1e2d4a",borderRadius:6,padding:"2px 7px",fontSize:10,color:"#64748b"}}>{HORIZON_DAYS[h]}d</span>
                      </div>
                      <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:8,fontSize:13,fontWeight:700,marginBottom:10,background:isUp?"#22c55e18":"#f8717118",color:dirColor,border:`1px solid ${isUp?"#22c55e33":"#f8717133"}`}}>
                        {isUp?"▲":"▼"} {d.direction}
                      </div>
                      <div style={{fontSize:22,fontWeight:800,color:"#f1f5f9",marginBottom:4,letterSpacing:-0.5}}>
                        ₹{parseFloat(d.predicted_price).toLocaleString("en-IN",{minimumFractionDigits:2})}
                      </div>
                      <div style={{fontSize:13,fontWeight:700,color:dirColor,marginBottom:12}}>{retStr} est. return</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <span style={{fontSize:11,color:"#475569",minWidth:50}}>P(Up)</span>
                        <div style={{flex:1,height:6,background:"#131f35",borderRadius:4,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${probPct}%`,background:dirColor,borderRadius:4}}/>
                        </div>
                        <span style={{fontSize:11,fontWeight:700,color:dirColor,minWidth:38,textAlign:"right"}}>{probPct}%</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
                        <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:6,background:cc.bg,color:cc.color,border:`1px solid ${cc.border}`}}>{d.confidence}</span>
                        <span style={{fontSize:11,color:"#475569"}}>confidence</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{fontSize:11,color:"#334155",textAlign:"center",padding:"10px",background:"#0b1120",border:"1px solid #1a2540",borderRadius:10}}>
              ⚠ Predictions are ML estimates only — not financial advice. Past performance ≠ future results.
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function SettingsPage({ holdings, onRefresh }) {
  const [saved,setSaved]=useState(false);
  const [currency,setCurrency]=useState(localStorage.getItem("pref_currency")||"AUTO");
  const [refreshInterval,setRefreshInterval]=useState(localStorage.getItem("pref_refresh")||"60");
  const [notifications,setNotifications]=useState(localStorage.getItem("pref_notif")!=="false");
  const [confirmClear,setConfirmClear]=useState(false);
  const handleSave=()=>{localStorage.setItem("pref_currency",currency);localStorage.setItem("pref_refresh",refreshInterval);localStorage.setItem("pref_notif",notifications);setSaved(true);setTimeout(()=>setSaved(false),2500);};
  const card={background:"#0d1623",border:"1px solid #1a2540",borderRadius:16,padding:"22px",marginBottom:18};
  const lbl={fontSize:10,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:0.6,display:"block",marginBottom:8};
  const inp={background:"#0b1120",border:"1px solid #1e2d4a",borderRadius:8,padding:"10px 14px",color:"#f1f5f9",fontSize:13,fontFamily:"inherit",outline:"none",cursor:"pointer"};
  const Toggle=({val,setter})=><button onClick={()=>setter(!val)} style={{width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",background:val?"#22c55e":"#1e2d4a",position:"relative",transition:"background 0.2s",flexShrink:0}}><span style={{position:"absolute",top:3,left:val?22:3,width:18,height:18,borderRadius:"50%",background:"white",transition:"left 0.2s"}}/></button>;
  return (
    <div style={{maxWidth:640}}>
      <div style={card}>
        <h3 style={{margin:"0 0 18px",fontSize:14,fontWeight:700,color:"#f1f5f9"}}>Account</h3>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#22c55e,#16a34a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>📊</div>
          <div><div style={{fontSize:14,fontWeight:700,color:"#f1f5f9"}}>Portfolio Tracker</div><div style={{fontSize:12,color:"#475569",marginTop:3}}>{holdings.length} active holding{holdings.length!==1?"s":""}</div></div>
          <button onClick={()=>{localStorage.removeItem("token");window.location.href="/login";}} style={{marginLeft:"auto",background:"#f8717118",border:"1px solid #f8717133",borderRadius:8,padding:"8px 14px",color:"#f87171",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Sign Out</button>
        </div>
      </div>
      <div style={card}>
        <h3 style={{margin:"0 0 18px",fontSize:14,fontWeight:700,color:"#f1f5f9"}}>Display Preferences</h3>
        <div style={{marginBottom:18}}>
          <span style={lbl}>Default Currency Display</span>
          <select value={currency} onChange={e=>setCurrency(e.target.value)} style={{...inp,width:"100%"}}><option value="AUTO">Auto (based on stock)</option><option value="INR">₹ Indian Rupee (INR)</option><option value="USD">$ US Dollar (USD)</option></select>
        </div>
        <div style={{marginBottom:18}}>
          <span style={lbl}>Price Refresh Interval</span>
          <select value={refreshInterval} onChange={e=>setRefreshInterval(e.target.value)} style={{...inp,width:"100%"}}><option value="30">Every 30 seconds</option><option value="60">Every 1 minute (recommended)</option><option value="120">Every 2 minutes</option><option value="300">Every 5 minutes</option></select>
          <div style={{fontSize:11,color:"#475569",marginTop:6}}>⚠ Lower intervals may hit API rate limits</div>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><div style={{fontSize:13,color:"#f1f5f9",fontWeight:600}}>Gain/Loss Notifications</div><div style={{fontSize:11,color:"#475569",marginTop:3}}>Show alerts for significant price movements</div></div>
          <Toggle val={notifications} setter={setNotifications}/>
        </div>
      </div>
      <div style={card}>
        <h3 style={{margin:"0 0 18px",fontSize:14,fontWeight:700,color:"#f1f5f9"}}>Portfolio Summary</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          {[{icon:"📈",label:"Total Stocks",value:holdings.length},{icon:"🇺🇸",label:"US Holdings",value:holdings.filter(h=>h.market!=="IN"&&h.currency!=="INR").length},{icon:"🇮🇳",label:"IN Holdings",value:holdings.filter(h=>h.market==="IN"||h.currency==="INR").length}].map(item=>(
            <div key={item.label} style={{background:"#0b1120",borderRadius:12,padding:"14px",textAlign:"center"}}><div style={{fontSize:22,marginBottom:6}}>{item.icon}</div><div style={{fontSize:18,fontWeight:800,color:"#f1f5f9"}}>{item.value}</div><div style={{fontSize:11,color:"#475569",marginTop:3}}>{item.label}</div></div>
          ))}
        </div>
      </div>
      <div style={{...card,border:"1px solid #3a1a1a",background:"linear-gradient(135deg,#150b0b,#0d0808)"}}>
        <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700,color:"#f87171"}}>⚠ Danger Zone</h3>
        <p style={{margin:"0 0 14px",fontSize:13,color:"#94a3b8"}}>Permanently remove all your stock holdings. This cannot be undone.</p>
        {!confirmClear?<button onClick={()=>setConfirmClear(true)} style={{background:"#f8717118",border:"1px solid #f8717144",borderRadius:8,padding:"9px 18px",color:"#f87171",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Clear All Holdings</button>
        :<div style={{display:"flex",gap:10}}>
          <button onClick={async()=>{for(const h of holdings){try{await deleteHolding(h._id);}catch{}}if(onRefresh)onRefresh();setConfirmClear(false);}} style={{background:"#f87171",border:"none",borderRadius:8,padding:"9px 18px",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Yes, delete everything</button>
          <button onClick={()=>setConfirmClear(false)} style={{background:"#131f35",border:"1px solid #1e2d4a",borderRadius:8,padding:"9px 18px",color:"#94a3b8",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        </div>}
      </div>
      <button onClick={handleSave} style={{width:"100%",background:saved?"#14532d":"linear-gradient(135deg,#22c55e,#16a34a)",border:"none",borderRadius:10,padding:"13px",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 10px #22c55e33",transition:"all 0.3s"}}>
        {saved?"✓ Saved!":"Save Preferences"}
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [holdings,setHoldings]=useState([]);
  const [activeNav,setActiveNav]=useState("Dashboard");

  const updatePrices=async(list)=>{
    const delay=ms=>new Promise(r=>setTimeout(r,ms));
    const updated=[...list];
    for(let i=0;i<list.length;i++){try{const res=await axios.get(`/api/stocks/price/${list[i].symbol}`);const price=res.data.price||0;if(price>0)updated[i]={...list[i],current:price,value:price*list[i].shares};}catch{}if(i<list.length-1)await delay(1500);}
    setHoldings([...updated]);
  };

  const loadPortfolio=async()=>{try{const{data}=await getPortfolio();const list=data.holdings||[];setHoldings(list);updatePrices(list);}catch(err){console.error(err);}};

  const calculateStats=()=>{
    if(!holdings.length)return{totalInvested:0,currentValue:0,profit:0,percent:0,bestStock:{name:"-",return:0},primaryCurrency:"USD",hasMixedCurrencies:false};
    let totalInvested=0,currentValue=0;let bestStock={name:"",return:-Infinity};const currencies=new Set();
    holdings.forEach(stock=>{const shares=stock.shares||0,avg=stock.avg_buy_price||0,current=stock.current||avg;totalInvested+=shares*avg;currentValue+=shares*current;currencies.add(stock.currency||"USD");const pct=avg>0?((current-avg)/avg)*100:0;if(pct>bestStock.return)bestStock={name:stock.symbol,return:pct.toFixed(2)};});
    const profit=currentValue-totalInvested,percent=totalInvested>0?((profit/totalInvested)*100).toFixed(2):0;
    const hasMixed=currencies.size>1,inrCount=holdings.filter(h=>h.currency==="INR").length;
    const primaryCurrency=hasMixed?"MIXED":(inrCount===holdings.length?"INR":"USD");
    return{totalInvested:totalInvested.toFixed(2),currentValue:currentValue.toFixed(2),profit:profit.toFixed(2),percent,bestStock,primaryCurrency,hasMixedCurrencies:hasMixed};
  };
  const stats=calculateStats();
  const pieData=holdings.map(h=>({name:h.symbol,value:Math.round((h.current||h.avg_buy_price)*h.shares)}));

  useEffect(()=>{const token=localStorage.getItem("token");if(!token)return;setAuthToken(token);loadPortfolio();},[]);
  useEffect(()=>{const interval=setInterval(()=>{if(holdings.length)updatePrices(holdings);},60000);return()=>clearInterval(interval);},[holdings]);

  const renderPage=()=>{
    switch(activeNav){
      case "Dashboard": case "Portfolio":
        return <><h2 style={{margin:"0 0 16px",fontSize:15,fontWeight:600,color:"#cbd5e1"}}>Portfolio Overview</h2><StatsBar stats={stats}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginTop:18}}><HoldingsTable holdings={holdings} onRefresh={loadPortfolio}/><ChartPanel pieData={pieData} holdings={holdings}/></div></>;
      case "Analytics":
        return <><h2 style={{margin:"0 0 16px",fontSize:15,fontWeight:600,color:"#cbd5e1"}}>Analytics</h2><AnalyticsPage holdings={holdings} stats={stats}/></>;
      case "Predictions":
        return <><h2 style={{margin:"0 0 16px",fontSize:15,fontWeight:600,color:"#cbd5e1"}}>Predictions</h2><PredictionsPage/></>;
      case "Settings":
        return <><h2 style={{margin:"0 0 20px",fontSize:15,fontWeight:600,color:"#cbd5e1"}}>Settings</h2><SettingsPage holdings={holdings} onRefresh={loadPortfolio}/></>;
      default: return null;
    }
  };

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#0e1623",fontFamily:"'DM Sans','Segoe UI',sans-serif",color:"#e2e8f0"}}>
      <nav style={{width:76,background:"#0b1120",borderRight:"1px solid #1a2540",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 0",gap:4,flexShrink:0,position:"fixed",top:0,left:0,height:"100vh",zIndex:50}}>
        <div style={{marginBottom:24,padding:"9px 11px",background:"linear-gradient(135deg,#22c55e,#16a34a)",borderRadius:12,boxShadow:"0 4px 14px #22c55e44",cursor:"pointer"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
        </div>
        {navItems.map(item=>{const isActive=activeNav===item.label;return(
          <button key={item.label} onClick={()=>setActiveNav(item.label)} title={item.label} style={{width:52,height:52,borderRadius:14,border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,background:isActive?"#22c55e18":"transparent",color:isActive?"#22c55e":"#475569",transition:"all 0.2s",position:"relative"}}>
            {isActive&&<div style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:3,height:28,background:"#22c55e",borderRadius:"0 4px 4px 0"}}/>}
            {item.icon}<span style={{fontSize:8.5,fontWeight:600,letterSpacing:0.3}}>{item.label}</span>
          </button>
        );})}
        <button onClick={()=>{localStorage.removeItem("token");window.location.href="/login";}} title="Logout" style={{marginTop:"auto",width:52,height:52,borderRadius:14,border:"none",cursor:"pointer",background:"transparent",color:"#475569",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.color="#f87171"} onMouseLeave={e=>e.currentTarget.style.color="#475569"}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </nav>
      <div style={{marginLeft:76,flex:1,display:"flex",flexDirection:"column"}}>
        <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 28px",borderBottom:"1px solid #1a2540",background:"#0b1120",position:"sticky",top:0,zIndex:40}}>
          <h1 style={{fontSize:20,fontWeight:700,margin:0,color:"#f1f5f9",letterSpacing:-0.3}}>{activeNav}</h1>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {holdings.length>0&&<div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#22c55e66"}}><span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px #22c55e"}}/> Live</div>}
            <button style={{background:"#131f35",border:"1px solid #1e2d4a",borderRadius:8,padding:"7px 16px",color:"#94a3b8",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontFamily:"inherit"}}>Summary <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg></button>
          </div>
        </header>
        <main style={{padding:"22px 28px",flex:1}}>{renderPage()}</main>
      </div>
    </div>
  );
}
