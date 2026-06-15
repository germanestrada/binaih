'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ── Translations ─────────────────────────────────────────────
const T = {
  es: {
    nav: { product:'Producto', pricing:'Planes', faq:'FAQ', contact:'Contacto', login:'Iniciar sesión', demo:'Solicitar demo' },
    hero: {
      badge: 'Auditorías inteligentes con IA',
      title: 'Transforma cómo auditas tus locaciones',
      sub: 'TVEO automatiza tus auditorías de tiendas, bodegas y puntos de venta con visión artificial, checklists inteligentes y trazabilidad completa en tiempo real.',
      cta1: 'Comenzar gratis',
      cta2: 'Ver demo',
      trust: 'Sin tarjeta de crédito · Configura en 5 minutos',
    },
    stats: [
      { value:'90%', label:'Reducción en tiempo de auditoría' },
      { value:'3×',  label:'Más auditorías por auditor/mes' },
      { value:'99%', label:'Trazabilidad de hallazgos' },
      { value:'<2s', label:'Análisis de imagen con IA' },
    ],
    features: {
      title: 'Todo lo que necesitas para auditar mejor',
      sub: 'Desde el checklist hasta el reporte, TVEO cubre cada paso del proceso.',
      items: [
        { icon:'📋', title:'Checklists estructurados', desc:'Define tipos de auditoría con ítems mixtos: binarios, escalas 1–10, numéricos y texto libre. Adapta cada checklist a tu operación.' },
        { icon:'✨', title:'IA de visión por ítem', desc:'El auditor sube una foto y la IA analiza automáticamente el ítem. Confianza alta = auto-aprobado. Confianza baja = revisión humana.' },
        { icon:'📦', title:'Análisis batch automático', desc:'Deposita imágenes en tu carpeta R2/S3 y TVEO dispara auditorías completas sin intervención humana. Modelo híbrido inteligente.' },
        { icon:'📊', title:'Dashboard en tiempo real', desc:'KPIs de cumplimiento, scores por locación, tendencias históricas y alertas de hallazgos críticos. Todo en una pantalla.' },
        { icon:'🔒', title:'Control de acceso granular', desc:'Restricciones por IP, horario y zona. Roles diferenciados: admin, auditor, viewer. 2FA para administradores.' },
        { icon:'🏢', title:'Multi-tenant y multi-sede', desc:'Un solo portal para todas tus locaciones. Cada empresa tiene su entorno aislado con datos seguros y configuración propia.' },
      ],
    },
    plans: {
      title: 'Planes para cada tamaño de operación',
      sub: 'Comienza gratis y escala cuando lo necesites.',
      monthly: 'Mensual',
      annual: 'Anual',
      save: 'Ahorra 20%',
      cta: 'Empezar ahora',
      contact: 'Contactar ventas',
      items: [
        { name:'Starter', price:'$0', priceAnnual:'$0', period:'/mes', color:'#111', popular:false,
          features:['Hasta 5 locaciones','3 usuarios','10 auditorías/mes','Dashboard básico','Soporte por email'] },
        { name:'Professional', price:'$149', priceAnnual:'$119', period:'/mes', color:'#1558b0', popular:true,
          features:['Hasta 30 locaciones','15 usuarios','100 auditorías/mes','IA de visión','Análisis batch','Mapa interactivo','API REST','Soporte prioritario'] },
        { name:'Enterprise', price:'Personalizado', priceAnnual:'Personalizado', period:'', color:'#111', popular:false,
          features:['Locaciones ilimitadas','Usuarios ilimitados','Auditorías ilimitadas','Todo Professional','Implementación dedicada','SLA garantizado','LLM on-premise','Integración ERP'] },
      ],
    },
    testimonials: {
      title: '¿Por qué TVEO?',
      items: [
        { quote:'Pasamos de auditar 8 tiendas al mes a 40. La IA hace el trabajo pesado y nuestros auditores solo revisan los hallazgos críticos.', name:'Directora de Operaciones', company:'Cadena retail · 120 puntos de venta' },
        { quote:'El análisis batch con nuestras cámaras de seguridad fue un game-changer. Las auditorías nocturnas ahora son 100% automáticas.', name:'Gerente de Calidad', company:'Distribuidora logística · 45 bodegas' },
        { quote:'La trazabilidad de hallazgos con foto y código de auditoría nos salvó en la última auditoría de la certificación ISO.', name:'Jefe de Cumplimiento', company:'Empresa de manufactura · 12 plantas' },
      ],
    },
    faq: {
      title: 'Preguntas frecuentes',
      items: [
        { q:'¿Necesito conocimientos técnicos para implementar TVEO?', a:'No. El sistema está diseñado para configurarse en minutos desde el panel de administración. No se requiere programación para crear tipos de auditoría, ítems de checklist o configurar la IA.' },
        { q:'¿Qué modelos de IA soporta TVEO?', a:'TVEO es compatible con cualquier API estilo OpenAI: GPT-4o Vision, Claude Vision, modelos locales vía vLLM, Ollama y más. Todo configurable desde el panel sin tocar código.' },
        { q:'¿Mis datos están seguros?', a:'Sí. Cada empresa (tenant) tiene datos completamente aislados. Soportamos despliegue on-premise para empresas con requisitos de privacidad estrictos. El sistema cumple con estándares de seguridad empresarial.' },
        { q:'¿Funciona en dispositivos móviles?', a:'Sí. La interfaz web es completamente responsiva. Los auditores pueden completar checklists y subir fotos desde cualquier dispositivo sin instalar nada.' },
        { q:'¿Puedo migrar mis locaciones actuales?', a:'Sí. TVEO tiene cargue masivo de locaciones vía CSV. También puede integrarse con tu sistema actual vía API REST para sincronizar datos automáticamente.' },
      ],
    },
    contact: {
      title: 'Habla con nuestro equipo',
      sub: 'Agenda una demo personalizada de 30 minutos y ve TVEO en acción con tus propios casos de uso.',
      name: 'Tu nombre',
      email: 'Tu email corporativo',
      company: 'Empresa',
      message: 'Cuéntanos sobre tu operación…',
      send: 'Solicitar demo',
      sent: '¡Mensaje enviado! Te contactaremos en menos de 24 horas.',
    },
    footer: {
      product: 'Producto',
      company: 'Empresa',
      legal: 'Legal',
      links: {
        product: ['Funcionalidades','Planes y precios','Documentación API','Casos de uso'],
        company: ['Nosotros','Blog','Contacto','Trabaja con nosotros'],
        legal: ['Términos de servicio','Privacidad','Cookies'],
      },
      copy: '© 2025 TVEO. Todos los derechos reservados.',
    },
  },
  en: {
    nav: { product:'Product', pricing:'Pricing', faq:'FAQ', contact:'Contact', login:'Log in', demo:'Request demo' },
    hero: {
      badge: 'AI-powered location audits',
      title: 'Transform how you audit your locations',
      sub: 'TVEO automates store, warehouse, and point-of-sale audits with computer vision, smart checklists, and complete real-time traceability.',
      cta1: 'Start for free',
      cta2: 'Watch demo',
      trust: 'No credit card required · Set up in 5 minutes',
    },
    stats: [
      { value:'90%', label:'Reduction in audit time' },
      { value:'3×',  label:'More audits per auditor/month' },
      { value:'99%', label:'Finding traceability' },
      { value:'<2s', label:'AI image analysis' },
    ],
    features: {
      title: 'Everything you need to audit better',
      sub: 'From checklist to report, TVEO covers every step of the process.',
      items: [
        { icon:'📋', title:'Structured checklists', desc:'Define audit types with mixed items: binary, 1–10 scales, numeric, and free text. Adapt each checklist to your operation.' },
        { icon:'✨', title:'Per-item AI vision', desc:'The auditor uploads a photo and AI automatically analyzes the item. High confidence = auto-approved. Low confidence = human review.' },
        { icon:'📦', title:'Automatic batch analysis', desc:'Drop images in your R2/S3 folder and TVEO triggers complete audits without human intervention. Smart hybrid model.' },
        { icon:'📊', title:'Real-time dashboard', desc:'Compliance KPIs, location scores, historical trends, and critical finding alerts. All on one screen.' },
        { icon:'🔒', title:'Granular access control', desc:'IP and schedule restrictions. Differentiated roles: admin, auditor, viewer. 2FA for administrators.' },
        { icon:'🏢', title:'Multi-tenant & multi-location', desc:'One portal for all your locations. Each company has its own isolated environment with secure data and custom configuration.' },
      ],
    },
    plans: {
      title: 'Plans for every operation size',
      sub: 'Start free and scale when you need to.',
      monthly: 'Monthly',
      annual: 'Annual',
      save: 'Save 20%',
      cta: 'Get started',
      contact: 'Contact sales',
      items: [
        { name:'Starter', price:'$0', priceAnnual:'$0', period:'/mo', color:'#111', popular:false,
          features:['Up to 5 locations','3 users','10 audits/month','Basic dashboard','Email support'] },
        { name:'Professional', price:'$149', priceAnnual:'$119', period:'/mo', color:'#1558b0', popular:true,
          features:['Up to 30 locations','15 users','100 audits/month','AI vision','Batch analysis','Interactive map','REST API','Priority support'] },
        { name:'Enterprise', price:'Custom', priceAnnual:'Custom', period:'', color:'#111', popular:false,
          features:['Unlimited locations','Unlimited users','Unlimited audits','All Professional','Dedicated implementation','Guaranteed SLA','On-premise LLM','ERP integration'] },
      ],
    },
    testimonials: {
      title: 'Why TVEO?',
      items: [
        { quote:'We went from auditing 8 stores a month to 40. AI does the heavy lifting and our auditors only review critical findings.', name:'Operations Director', company:'Retail chain · 120 stores' },
        { quote:'Batch analysis with our security cameras was a game-changer. Overnight audits are now 100% automatic.', name:'Quality Manager', company:'Logistics distributor · 45 warehouses' },
        { quote:'Finding traceability with photos and audit codes saved us in the last ISO certification audit.', name:'Compliance Manager', company:'Manufacturing company · 12 plants' },
      ],
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        { q:'Do I need technical knowledge to implement TVEO?', a:'No. The system is designed to be configured in minutes from the admin panel. No coding required to create audit types, checklist items, or configure AI.' },
        { q:'What AI models does TVEO support?', a:'TVEO is compatible with any OpenAI-style API: GPT-4o Vision, Claude Vision, local models via vLLM, Ollama, and more. All configurable from the panel without touching code.' },
        { q:'Is my data secure?', a:'Yes. Each company (tenant) has completely isolated data. We support on-premise deployment for companies with strict privacy requirements. The system meets enterprise security standards.' },
        { q:'Does it work on mobile devices?', a:'Yes. The web interface is fully responsive. Auditors can complete checklists and upload photos from any device without installing anything.' },
        { q:'Can I migrate my current locations?', a:'Yes. TVEO has bulk location upload via CSV. It can also integrate with your current system via REST API to sync data automatically.' },
      ],
    },
    contact: {
      title: 'Talk to our team',
      sub: 'Schedule a personalized 30-minute demo and see TVEO in action with your own use cases.',
      name: 'Your name',
      email: 'Your business email',
      company: 'Company',
      message: 'Tell us about your operation…',
      send: 'Request demo',
      sent: 'Message sent! We\'ll contact you within 24 hours.',
    },
    footer: {
      product: 'Product',
      company: 'Company',
      legal: 'Legal',
      links: {
        product: ['Features','Plans & pricing','API docs','Use cases'],
        company: ['About us','Blog','Contact','Careers'],
        legal: ['Terms of service','Privacy','Cookies'],
      },
      copy: '© 2025 TVEO. All rights reserved.',
    },
  },
}

export default function LandingPage() {
  const [lang, setLang] = useState<'es'|'en'>('es')
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number|null>(null)
  const [sent, setSent] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [form, setForm] = useState({name:'',email:'',company:'',message:''})
  const heroRef = useRef<HTMLDivElement>(null)

  const t = T[lang]

  useEffect(()=>{
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  },[])

  const sendContact = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  // ── Styles ────────────────────────────────────────────────
  const NAV_H = 64

  return (
    <div style={{fontFamily:'"DM Sans",system-ui,sans-serif',color:'#111',background:'#fff',overflowX:'hidden'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:'DM Sans',system-ui,sans-serif}
        .serif{font-family:'DM Serif Display',Georgia,serif}
        .fade-up{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
        .fade-up.visible{opacity:1;transform:none}
        .card-hover{transition:transform .2s ease,box-shadow .2s ease}
        .card-hover:hover{transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,.1)}
        .btn-primary{background:#111;color:#fff;border:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:500;cursor:pointer;font-family:inherit;transition:background .15s,transform .1s}
        .btn-primary:hover{background:#333;transform:translateY(-1px)}
        .btn-secondary{background:transparent;color:#111;border:1.5px solid #ddd;padding:13px 28px;border-radius:10px;font-size:15px;font-weight:500;cursor:pointer;font-family:inherit;transition:border-color .15s,transform .1s}
        .btn-secondary:hover{border-color:#111;transform:translateY(-1px)}
        .tag{display:inline-flex;align-items:center;gap:7px;background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;padding:6px 14px;border-radius:100px;font-size:13px;font-weight:500}
        input,textarea,select{font-family:inherit}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:#f5f5f5}
        ::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px}
      `}</style>

      {/* ── NAV ── */}
      <nav style={{position:'fixed',top:0,left:0,right:0,height:NAV_H,zIndex:100,transition:'background .3s,box-shadow .3s',background:scrolled?'rgba(255,255,255,.95)':'transparent',backdropFilter:scrolled?'blur(12px)':'none',boxShadow:scrolled?'0 1px 0 #eee':'none'}}>
        <div style={{maxWidth:1160,margin:'0 auto',padding:'0 24px',height:'100%',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          {/* Logo */}
          <a href="/" style={{display:'flex',alignItems:'center',gap:9,textDecoration:'none'}}>
            <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
              <rect x="1" y="1" width="18" height="18" rx="4" stroke="#111" strokeWidth="1.5"/>
              <path d="M5 10 L10 5 L15 10" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 14 L10 9 L15 14" stroke="rgba(0,0,0,.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="serif" style={{fontSize:19,color:'#111',letterSpacing:.3}}>TVEO</span>
          </a>
          {/* Links */}
          <div style={{display:'flex',alignItems:'center',gap:28}}>
            {['product','pricing','faq','contact'].map(k=>(
              <a key={k} href={`#${k}`} style={{fontSize:14,color:'#555',textDecoration:'none',fontWeight:400,transition:'color .15s'}}
                onMouseEnter={e=>(e.target as HTMLAnchorElement).style.color='#111'}
                onMouseLeave={e=>(e.target as HTMLAnchorElement).style.color='#555'}>
                {(t.nav as any)[k]}
              </a>
            ))}
          </div>
          {/* Actions */}
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {/* Lang toggle */}
            <button onClick={()=>setLang(l=>l==='es'?'en':'es')} style={{background:'#f5f5f5',border:'none',padding:'6px 12px',borderRadius:8,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:500,color:'#555'}}>
              {lang==='es'?'EN':'ES'}
            </button>
            <Link href="/login" style={{fontSize:14,color:'#555',textDecoration:'none',fontWeight:400,padding:'8px 14px'}}>{t.nav.login}</Link>
            <a href="#contact" className="btn-primary" style={{padding:'9px 20px',fontSize:14,borderRadius:8,textDecoration:'none',display:'inline-block'}}>
              {t.nav.demo}
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:`${NAV_H+40}px 24px 80px`,background:'linear-gradient(180deg,#fafafa 0%,#fff 100%)',position:'relative',overflow:'hidden'}}>
        {/* Grid background */}
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(#e5e7eb 1px,transparent 1px),linear-gradient(90deg,#e5e7eb 1px,transparent 1px)',backgroundSize:'48px 48px',opacity:.35,pointerEvents:'none'}}/>
        {/* Blob */}
        <div style={{position:'absolute',top:'20%',right:'-10%',width:600,height:600,background:'radial-gradient(circle,rgba(59,130,246,.08) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:'10%',left:'-5%',width:400,height:400,background:'radial-gradient(circle,rgba(16,185,129,.07) 0%,transparent 70%)',pointerEvents:'none'}}/>

        <div style={{maxWidth:820,textAlign:'center',position:'relative'}}>
          <div className="tag" style={{marginBottom:24}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'#0ea5e9',display:'inline-block'}}/>
            {t.hero.badge}
          </div>
          <h1 className="serif" style={{fontSize:'clamp(42px,6vw,72px)',lineHeight:1.08,letterSpacing:'-1.5px',color:'#0a0a0a',marginBottom:20,fontWeight:400}}>
            {t.hero.title}
          </h1>
          <p style={{fontSize:18,color:'#555',lineHeight:1.65,maxWidth:600,margin:'0 auto 36px',fontWeight:300}}>
            {t.hero.sub}
          </p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:18}}>
            <a href="/demo" className="btn-primary" style={{textDecoration:'none',padding:'15px 32px',fontSize:16,borderRadius:12,display:'inline-flex',alignItems:'center',gap:8}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:'#60a5fa',display:'inline-block'}}/>
              {lang==='es'?'Explorar demo en vivo':'Try live demo'}
            </a>
            <a href="#contact" className="btn-secondary" style={{textDecoration:'none',padding:'15px 32px',fontSize:16,borderRadius:12}}>
              {t.hero.cta1}
            </a>
          </div>
          <p style={{fontSize:13,color:'#aaa'}}>{t.hero.trust}</p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{background:'#0a0a0a',padding:'56px 24px'}}>
        <div style={{maxWidth:900,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0}}>
          {t.stats.map((s,i)=>(
            <div key={i} style={{textAlign:'center',padding:'20px',borderRight:i<3?'1px solid rgba(255,255,255,.08)':'none'}}>
              <div className="serif" style={{fontSize:42,color:'white',lineHeight:1,marginBottom:8,letterSpacing:'-1px'}}>{s.value}</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,.45)',lineHeight:1.4}}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="product" style={{padding:'100px 24px',background:'#fff'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:64}}>
            <h2 className="serif" style={{fontSize:'clamp(32px,4vw,48px)',color:'#0a0a0a',marginBottom:14,fontWeight:400,letterSpacing:'-.5px'}}>{t.features.title}</h2>
            <p style={{fontSize:17,color:'#666',maxWidth:480,margin:'0 auto',fontWeight:300}}>{t.features.sub}</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24}}>
            {t.features.items.map((f,i)=>(
              <div key={i} className="card-hover" style={{background:'#fafafa',border:'1px solid #eee',borderRadius:16,padding:'28px 24px'}}>
                <div style={{fontSize:32,marginBottom:14}}>{f.icon}</div>
                <h3 style={{fontSize:17,fontWeight:600,color:'#111',marginBottom:8}}>{f.title}</h3>
                <p style={{fontSize:14,color:'#666',lineHeight:1.6}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section id="pricing" style={{padding:'100px 24px',background:'#f9f9f9'}}>
        <div style={{maxWidth:1000,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <h2 className="serif" style={{fontSize:'clamp(32px,4vw,48px)',color:'#0a0a0a',marginBottom:14,fontWeight:400,letterSpacing:'-.5px'}}>{t.plans.title}</h2>
            <p style={{fontSize:17,color:'#666',marginBottom:28,fontWeight:300}}>{t.plans.sub}</p>
            {/* Toggle */}
            <div style={{display:'inline-flex',background:'#eee',borderRadius:100,padding:4,gap:2}}>
              {[false,true].map(a=>(
                <button key={String(a)} onClick={()=>setAnnual(a)} style={{padding:'7px 20px',borderRadius:100,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:14,fontWeight:annual===a?500:400,background:annual===a?'#fff':'transparent',color:annual===a?'#111':'#777',transition:'all .2s',boxShadow:annual===a?'0 1px 4px rgba(0,0,0,.1)':'none'}}>
                  {a?t.plans.annual:t.plans.monthly}
                  {a&&<span style={{marginLeft:6,fontSize:11,color:'#16a34a',fontWeight:600}}>{t.plans.save}</span>}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,alignItems:'start'}}>
            {t.plans.items.map((p,i)=>(
              <div key={i} className="card-hover" style={{background:'#fff',border:p.popular?'2px solid #111':'1px solid #e5e5e5',borderRadius:20,padding:'32px 28px',position:'relative'}}>
                {p.popular&&(
                  <div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',background:'#111',color:'#fff',fontSize:12,fontWeight:600,padding:'4px 16px',borderRadius:100,whiteSpace:'nowrap'}}>
                    {lang==='es'?'Más popular':'Most popular'}
                  </div>
                )}
                <div style={{marginBottom:20}}>
                  <h3 style={{fontSize:20,fontWeight:600,color:'#111',marginBottom:6}}>{p.name}</h3>
                  <div style={{display:'flex',alignItems:'baseline',gap:4}}>
                    <span className="serif" style={{fontSize:42,color:'#111',letterSpacing:'-1px'}}>{annual?p.priceAnnual:p.price}</span>
                    {p.period&&<span style={{fontSize:14,color:'#888'}}>{p.period}</span>}
                  </div>
                </div>
                <ul style={{listStyle:'none',marginBottom:28,display:'flex',flexDirection:'column',gap:10}}>
                  {p.features.map((f,j)=>(
                    <li key={j} style={{display:'flex',alignItems:'center',gap:10,fontSize:14,color:'#444'}}>
                      <span style={{width:18,height:18,borderRadius:'50%',background:'#f0fdf4',border:'1px solid #86efac',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:11,color:'#16a34a',fontWeight:700}}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={i===2?'#contact':'/demo'} className={p.popular?'btn-primary':'btn-secondary'} style={{display:'block',textAlign:'center',textDecoration:'none',padding:'12px',borderRadius:10,fontSize:14,fontWeight:500,width:'100%',border:p.popular?'none':'1.5px solid #ddd',background:p.popular?'#111':'transparent',color:p.popular?'#fff':'#111'}}>
                  {i===2?t.plans.contact:i===0?lang==='es'?'Ver demo':'Try demo':t.plans.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{padding:'100px 24px',background:'#0a0a0a'}}>
        <div style={{maxWidth:1000,margin:'0 auto'}}>
          <h2 className="serif" style={{fontSize:'clamp(32px,4vw,48px)',color:'white',marginBottom:56,textAlign:'center',fontWeight:400,letterSpacing:'-.5px'}}>{t.testimonials.title}</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
            {t.testimonials.items.map((item,i)=>(
              <div key={i} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:16,padding:'28px 24px'}}>
                <div style={{fontSize:28,color:'rgba(255,255,255,.15)',fontFamily:'Georgia,serif',lineHeight:.8,marginBottom:16}}>"</div>
                <p style={{fontSize:15,color:'rgba(255,255,255,.7)',lineHeight:1.65,marginBottom:20,fontWeight:300}}>{item.quote}</p>
                <div style={{borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:16}}>
                  <div style={{fontSize:13,fontWeight:600,color:'white'}}>{item.name}</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginTop:2}}>{item.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{padding:'100px 24px',background:'#fff'}}>
        <div style={{maxWidth:680,margin:'0 auto'}}>
          <h2 className="serif" style={{fontSize:'clamp(32px,4vw,48px)',color:'#0a0a0a',marginBottom:48,textAlign:'center',fontWeight:400,letterSpacing:'-.5px'}}>{t.faq.title}</h2>
          <div style={{display:'flex',flexDirection:'column',gap:0}}>
            {t.faq.items.map((item,i)=>(
              <div key={i} style={{borderBottom:'1px solid #eee',overflow:'hidden'}}>
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'22px 0',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>
                  <span style={{fontSize:16,fontWeight:500,color:'#111',paddingRight:20}}>{item.q}</span>
                  <span style={{fontSize:20,color:'#aaa',transition:'transform .2s',transform:openFaq===i?'rotate(45deg)':'rotate(0)',flexShrink:0}}>+</span>
                </button>
                <div style={{maxHeight:openFaq===i?'200px':'0',overflow:'hidden',transition:'max-height .3s ease'}}>
                  <p style={{fontSize:15,color:'#666',lineHeight:1.65,paddingBottom:20}}>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{padding:'100px 24px',background:'#f9f9f9'}}>
        <div style={{maxWidth:520,margin:'0 auto',textAlign:'center'}}>
          <h2 className="serif" style={{fontSize:'clamp(32px,4vw,44px)',color:'#0a0a0a',marginBottom:12,fontWeight:400,letterSpacing:'-.5px'}}>{t.contact.title}</h2>
          <p style={{fontSize:16,color:'#666',marginBottom:40,lineHeight:1.6,fontWeight:300}}>{t.contact.sub}</p>
          {sent?(
            <div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:12,padding:'24px',fontSize:15,color:'#16a34a',fontWeight:500}}>
              ✓ {t.contact.sent}
            </div>
          ):(
            <form onSubmit={sendContact} style={{display:'flex',flexDirection:'column',gap:14,textAlign:'left'}}>
              {[
                {k:'name',   label:t.contact.name,    type:'text'},
                {k:'email',  label:t.contact.email,   type:'email'},
                {k:'company',label:t.contact.company, type:'text'},
              ].map(f=>(
                <input key={f.k} type={f.type} required placeholder={f.label} value={(form as any)[f.k]}
                  onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}
                  style={{border:'1px solid #ddd',borderRadius:10,padding:'13px 16px',fontSize:15,outline:'none',background:'white',transition:'border-color .15s'}}
                  onFocus={e=>(e.target as HTMLInputElement).style.borderColor='#111'}
                  onBlur={e=>(e.target as HTMLInputElement).style.borderColor='#ddd'}
                />
              ))}
              <textarea required placeholder={t.contact.message} value={form.message}
                onChange={e=>setForm(p=>({...p,message:e.target.value}))}
                rows={4} style={{border:'1px solid #ddd',borderRadius:10,padding:'13px 16px',fontSize:15,outline:'none',resize:'vertical',background:'white',fontFamily:'inherit',transition:'border-color .15s'}}
                onFocus={e=>(e.target as HTMLTextAreaElement).style.borderColor='#111'}
                onBlur={e=>(e.target as HTMLTextAreaElement).style.borderColor='#ddd'}
              />
              <button type="submit" className="btn-primary" style={{padding:'14px',fontSize:16,borderRadius:10,width:'100%'}}>
                {t.contact.send}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{background:'#0a0a0a',padding:'64px 24px 32px',color:'rgba(255,255,255,.45)'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:40,marginBottom:48}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                  <rect x="1" y="1" width="18" height="18" rx="4" stroke="white" strokeWidth="1.5"/>
                  <path d="M5 10 L10 5 L15 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 14 L10 9 L15 14" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="serif" style={{fontSize:17,color:'white'}}>TVEO</span>
              </div>
              <p style={{fontSize:13,lineHeight:1.7,maxWidth:240}}>Plataforma de auditorías inteligentes con IA para retail, logística y manufactura.</p>
            </div>
            {(['product','company','legal'] as const).map(section=>(
              <div key={section}>
                <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,.6)',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:16}}>{t.footer[section]}</div>
                <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
                  {t.footer.links[section].map((link,j)=>(
                    <li key={j}><a href="#" style={{fontSize:13,color:'rgba(255,255,255,.4)',textDecoration:'none',transition:'color .15s'}}
                      onMouseEnter={e=>(e.target as HTMLAnchorElement).style.color='white'}
                      onMouseLeave={e=>(e.target as HTMLAnchorElement).style.color='rgba(255,255,255,.4)'}>{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,.07)',paddingTop:24,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:12}}>{t.footer.copy}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
