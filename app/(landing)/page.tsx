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

  // ── Design tokens (Supabase-inspired) ───────────────────────
  const NAV_H = 64
  const BG = '#171717'
  const SURFACE = '#1c1c1c'
  const BORDER_SUBTLE = '#242424'
  const BORDER = '#2e2e2e'
  const BORDER_STRONG = '#363636'
  const TEXT = '#fafafa'
  const TEXT_MUTED = '#a0a0a0'
  const TEXT_FAINT = '#707070'
  const GREEN = '#3ecf8e'
  const GREEN_HOVER = '#00c573'
  const GREEN_SOFT_BORDER = 'rgba(62,207,142,.3)'
  const GREEN_SOFT_BG = 'rgba(62,207,142,.08)'

  return (
    <div style={{fontFamily:'Inter,system-ui,sans-serif',color:TEXT,background:BG,overflowX:'hidden'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:'Inter',system-ui,sans-serif;background:${BG}}
        .mono{font-family:'JetBrains Mono',monospace}
        .fade-up{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
        .fade-up.visible{opacity:1;transform:none}
        .card-hover{transition:border-color .2s ease,background .2s ease,transform .2s ease}
        .card-hover:hover{border-color:${BORDER_STRONG} !important;transform:translateY(-2px)}
        .btn-primary{background:${GREEN};color:#0b0b0b;border:none;padding:13px 26px;border-radius:9999px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;transition:background .15s,transform .1s}
        .btn-primary:hover{background:${GREEN_HOVER};transform:translateY(-1px)}
        .btn-secondary{background:transparent;color:${TEXT};border:1px solid ${BORDER};padding:12px 26px;border-radius:9999px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;transition:border-color .15s,transform .1s}
        .btn-secondary:hover{border-color:${BORDER_STRONG};transform:translateY(-1px)}
        .tag{display:inline-flex;align-items:center;gap:8px;background:transparent;color:${GREEN};border:1px solid ${GREEN_SOFT_BORDER};padding:6px 14px;border-radius:9999px;font-size:12px;font-weight:500;letter-spacing:.4px;text-transform:uppercase;font-family:'JetBrains Mono',monospace}
        input,textarea,select{font-family:inherit}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:${BG}}
        ::-webkit-scrollbar-thumb{background:${BORDER_STRONG};border-radius:3px}
      `}</style>

      {/* ── NAV ── */}
      <nav style={{position:'fixed',top:0,left:0,right:0,height:NAV_H,zIndex:100,transition:'background .3s,border-color .3s',background:scrolled?'rgba(23,23,23,.9)':'transparent',backdropFilter:scrolled?'blur(12px)':'none',borderBottom:scrolled?`1px solid ${BORDER_SUBTLE}`:'1px solid transparent'}}>
        <div style={{maxWidth:1160,margin:'0 auto',padding:'0 24px',height:'100%',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          {/* Logo */}
          <a href="/" style={{display:'flex',alignItems:'center',gap:9,textDecoration:'none'}}>
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
              <rect x="1" y="1" width="18" height="18" rx="4" stroke={GREEN} strokeWidth="1.5"/>
              <path d="M5 10 L10 5 L15 10" stroke={TEXT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 14 L10 9 L15 14" stroke={TEXT_FAINT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{fontSize:17,fontWeight:500,color:TEXT,letterSpacing:.2}}>TVEO</span>
          </a>
          {/* Links */}
          <div style={{display:'flex',alignItems:'center',gap:28}}>
            {['product','pricing','faq','contact'].map(k=>(
              <a key={k} href={`#${k}`} style={{fontSize:14,color:TEXT_MUTED,textDecoration:'none',fontWeight:400,transition:'color .15s'}}
                onMouseEnter={e=>(e.target as HTMLAnchorElement).style.color=TEXT}
                onMouseLeave={e=>(e.target as HTMLAnchorElement).style.color=TEXT_MUTED}>
                {(t.nav as any)[k]}
              </a>
            ))}
          </div>
          {/* Actions */}
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {/* Lang toggle */}
            <button onClick={()=>setLang(l=>l==='es'?'en':'es')} style={{background:SURFACE,border:`1px solid ${BORDER}`,padding:'6px 12px',borderRadius:8,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:500,color:TEXT_MUTED}}>
              {lang==='es'?'EN':'ES'}
            </button>
            <Link href="/login" style={{fontSize:14,color:TEXT_MUTED,textDecoration:'none',fontWeight:400,padding:'8px 14px'}}>{t.nav.login}</Link>
            <a href="#contact" className="btn-primary" style={{padding:'9px 20px',fontSize:14,borderRadius:9999,textDecoration:'none',display:'inline-block'}}>
              {t.nav.demo}
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:`${NAV_H+40}px 24px 80px`,background:BG,position:'relative',overflow:'hidden'}}>
        {/* Dot grid background */}
        <div style={{position:'absolute',inset:0,backgroundImage:`radial-gradient(${BORDER_SUBTLE} 1px,transparent 1px)`,backgroundSize:'32px 32px',opacity:.6,pointerEvents:'none'}}/>
        {/* Faint green glow — identity marker only, kept subtle */}
        <div style={{position:'absolute',top:'-10%',left:'50%',transform:'translateX(-50%)',width:700,height:400,background:'radial-gradient(ellipse,rgba(62,207,142,.12) 0%,transparent 70%)',pointerEvents:'none'}}/>

        <div style={{maxWidth:820,textAlign:'center',position:'relative'}}>
          <div className="tag" style={{marginBottom:28}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:GREEN,display:'inline-block'}}/>
            {t.hero.badge}
          </div>
          <h1 style={{fontSize:'clamp(40px,6vw,68px)',lineHeight:1.0,letterSpacing:'-1.5px',color:TEXT,marginBottom:22,fontWeight:500}}>
            {t.hero.title}
          </h1>
          <p style={{fontSize:18,color:TEXT_MUTED,lineHeight:1.65,maxWidth:600,margin:'0 auto 36px',fontWeight:400}}>
            {t.hero.sub}
          </p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:18}}>
            <a href="/demo" className="btn-primary" style={{textDecoration:'none',padding:'15px 30px',fontSize:15,borderRadius:9999,display:'inline-flex',alignItems:'center',gap:8}}>
              {lang==='es'?'Explorar demo en vivo':'Try live demo'}
            </a>
            <a href="#contact" className="btn-secondary" style={{textDecoration:'none',padding:'14px 30px',fontSize:15,borderRadius:9999}}>
              {t.hero.cta1}
            </a>
          </div>
          <p className="mono" style={{fontSize:12,color:TEXT_FAINT,letterSpacing:.3}}>{t.hero.trust}</p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{background:BG,padding:'56px 24px',borderTop:`1px solid ${BORDER_SUBTLE}`,borderBottom:`1px solid ${BORDER_SUBTLE}`}}>
        <div style={{maxWidth:900,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0}}>
          {t.stats.map((s,i)=>(
            <div key={i} style={{textAlign:'center',padding:'20px',borderRight:i<3?`1px solid ${BORDER_SUBTLE}`:'none'}}>
              <div style={{fontSize:38,color:GREEN,lineHeight:1,marginBottom:8,letterSpacing:'-1px',fontWeight:500}}>{s.value}</div>
              <div style={{fontSize:13,color:TEXT_MUTED,lineHeight:1.4}}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="product" style={{padding:'100px 24px',background:BG}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:64}}>
            <h2 style={{fontSize:'clamp(30px,4vw,44px)',color:TEXT,marginBottom:14,fontWeight:500,letterSpacing:'-.5px'}}>{t.features.title}</h2>
            <p style={{fontSize:16,color:TEXT_MUTED,maxWidth:480,margin:'0 auto',fontWeight:400}}>{t.features.sub}</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
            {t.features.items.map((f,i)=>(
              <div key={i} className="card-hover" style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'28px 24px'}}>
                <div style={{fontSize:28,marginBottom:14}}>{f.icon}</div>
                <h3 style={{fontSize:16,fontWeight:500,color:TEXT,marginBottom:8}}>{f.title}</h3>
                <p style={{fontSize:14,color:TEXT_MUTED,lineHeight:1.6}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section id="pricing" style={{padding:'100px 24px',background:BG,borderTop:`1px solid ${BORDER_SUBTLE}`}}>
        <div style={{maxWidth:1000,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <h2 style={{fontSize:'clamp(30px,4vw,44px)',color:TEXT,marginBottom:14,fontWeight:500,letterSpacing:'-.5px'}}>{t.plans.title}</h2>
            <p style={{fontSize:16,color:TEXT_MUTED,marginBottom:28,fontWeight:400}}>{t.plans.sub}</p>
            {/* Toggle */}
            <div style={{display:'inline-flex',background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:9999,padding:4,gap:2}}>
              {[false,true].map(a=>(
                <button key={String(a)} onClick={()=>setAnnual(a)} style={{padding:'7px 20px',borderRadius:9999,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:14,fontWeight:annual===a?500:400,background:annual===a?GREEN:'transparent',color:annual===a?'#0b0b0b':TEXT_MUTED,transition:'all .2s'}}>
                  {a?t.plans.annual:t.plans.monthly}
                  {a&&<span style={{marginLeft:6,fontSize:11,color:annual===a?'#0b0b0b':GREEN,fontWeight:600}}>{t.plans.save}</span>}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,alignItems:'start'}}>
            {t.plans.items.map((p,i)=>(
              <div key={i} className="card-hover" style={{background:SURFACE,border:p.popular?`1px solid ${GREEN_SOFT_BORDER}`:`1px solid ${BORDER}`,borderRadius:16,padding:'32px 28px',position:'relative'}}>
                {p.popular&&(
                  <div style={{position:'absolute',top:-13,left:'50%',transform:'translateX(-50%)',background:GREEN,color:'#0b0b0b',fontSize:12,fontWeight:600,padding:'4px 16px',borderRadius:9999,whiteSpace:'nowrap'}}>
                    {lang==='es'?'Más popular':'Most popular'}
                  </div>
                )}
                <div style={{marginBottom:20}}>
                  <h3 style={{fontSize:18,fontWeight:500,color:TEXT,marginBottom:6}}>{p.name}</h3>
                  <div style={{display:'flex',alignItems:'baseline',gap:4}}>
                    <span style={{fontSize:38,color:TEXT,letterSpacing:'-1px',fontWeight:500}}>{annual?p.priceAnnual:p.price}</span>
                    {p.period&&<span style={{fontSize:14,color:TEXT_FAINT}}>{p.period}</span>}
                  </div>
                </div>
                <ul style={{listStyle:'none',marginBottom:28,display:'flex',flexDirection:'column',gap:10}}>
                  {p.features.map((f,j)=>(
                    <li key={j} style={{display:'flex',alignItems:'center',gap:10,fontSize:14,color:TEXT_MUTED}}>
                      <span style={{width:18,height:18,borderRadius:'50%',background:GREEN_SOFT_BG,border:`1px solid ${GREEN_SOFT_BORDER}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:11,color:GREEN,fontWeight:700}}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={i===2?'#contact':'/demo'} className={p.popular?'btn-primary':'btn-secondary'} style={{display:'block',textAlign:'center',textDecoration:'none',padding:'12px',borderRadius:9999,fontSize:14,fontWeight:500,width:'100%'}}>
                  {i===2?t.plans.contact:i===0?lang==='es'?'Ver demo':'Try demo':t.plans.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{padding:'100px 24px',background:BG,borderTop:`1px solid ${BORDER_SUBTLE}`}}>
        <div style={{maxWidth:1000,margin:'0 auto'}}>
          <h2 style={{fontSize:'clamp(30px,4vw,44px)',color:TEXT,marginBottom:56,textAlign:'center',fontWeight:500,letterSpacing:'-.5px'}}>{t.testimonials.title}</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
            {t.testimonials.items.map((item,i)=>(
              <div key={i} className="card-hover" style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'28px 24px'}}>
                <div className="mono" style={{fontSize:24,color:GREEN,opacity:.5,lineHeight:.8,marginBottom:16}}>"</div>
                <p style={{fontSize:14,color:TEXT_MUTED,lineHeight:1.65,marginBottom:20,fontWeight:400}}>{item.quote}</p>
                <div style={{borderTop:`1px solid ${BORDER_SUBTLE}`,paddingTop:16}}>
                  <div style={{fontSize:13,fontWeight:500,color:TEXT}}>{item.name}</div>
                  <div style={{fontSize:12,color:TEXT_FAINT,marginTop:2}}>{item.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{padding:'100px 24px',background:BG,borderTop:`1px solid ${BORDER_SUBTLE}`}}>
        <div style={{maxWidth:680,margin:'0 auto'}}>
          <h2 style={{fontSize:'clamp(30px,4vw,44px)',color:TEXT,marginBottom:48,textAlign:'center',fontWeight:500,letterSpacing:'-.5px'}}>{t.faq.title}</h2>
          <div style={{display:'flex',flexDirection:'column',gap:0}}>
            {t.faq.items.map((item,i)=>(
              <div key={i} style={{borderBottom:`1px solid ${BORDER_SUBTLE}`,overflow:'hidden'}}>
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'22px 0',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>
                  <span style={{fontSize:15,fontWeight:500,color:TEXT,paddingRight:20}}>{item.q}</span>
                  <span style={{fontSize:18,color:openFaq===i?GREEN:TEXT_FAINT,transition:'transform .2s,color .2s',transform:openFaq===i?'rotate(45deg)':'rotate(0)',flexShrink:0}}>+</span>
                </button>
                <div style={{maxHeight:openFaq===i?'200px':'0',overflow:'hidden',transition:'max-height .3s ease'}}>
                  <p style={{fontSize:14,color:TEXT_MUTED,lineHeight:1.65,paddingBottom:20}}>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{padding:'100px 24px',background:BG,borderTop:`1px solid ${BORDER_SUBTLE}`}}>
        <div style={{maxWidth:520,margin:'0 auto',textAlign:'center'}}>
          <h2 style={{fontSize:'clamp(28px,4vw,40px)',color:TEXT,marginBottom:12,fontWeight:500,letterSpacing:'-.5px'}}>{t.contact.title}</h2>
          <p style={{fontSize:15,color:TEXT_MUTED,marginBottom:40,lineHeight:1.6,fontWeight:400}}>{t.contact.sub}</p>
          {sent?(
            <div style={{background:GREEN_SOFT_BG,border:`1px solid ${GREEN_SOFT_BORDER}`,borderRadius:12,padding:'24px',fontSize:14,color:GREEN,fontWeight:500}}>
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
                  style={{border:`1px solid ${BORDER}`,borderRadius:8,padding:'13px 16px',fontSize:14,outline:'none',background:SURFACE,color:TEXT,transition:'border-color .15s'}}
                  onFocus={e=>(e.target as HTMLInputElement).style.borderColor=GREEN}
                  onBlur={e=>(e.target as HTMLInputElement).style.borderColor=BORDER}
                />
              ))}
              <textarea required placeholder={t.contact.message} value={form.message}
                onChange={e=>setForm(p=>({...p,message:e.target.value}))}
                rows={4} style={{border:`1px solid ${BORDER}`,borderRadius:8,padding:'13px 16px',fontSize:14,outline:'none',resize:'vertical',background:SURFACE,color:TEXT,fontFamily:'inherit',transition:'border-color .15s'}}
                onFocus={e=>(e.target as HTMLTextAreaElement).style.borderColor=GREEN}
                onBlur={e=>(e.target as HTMLTextAreaElement).style.borderColor=BORDER}
              />
              <button type="submit" className="btn-primary" style={{padding:'14px',fontSize:15,borderRadius:9999,width:'100%'}}>
                {t.contact.send}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{background:BG,padding:'64px 24px 32px',color:TEXT_MUTED,borderTop:`1px solid ${BORDER_SUBTLE}`}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:40,marginBottom:48}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="1" y="1" width="18" height="18" rx="4" stroke={GREEN} strokeWidth="1.5"/>
                  <path d="M5 10 L10 5 L15 10" stroke={TEXT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 14 L10 9 L15 14" stroke={TEXT_FAINT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{fontSize:16,fontWeight:500,color:TEXT}}>TVEO</span>
              </div>
              <p style={{fontSize:13,lineHeight:1.7,maxWidth:240,color:TEXT_FAINT}}>Plataforma de auditorías inteligentes con IA para retail, logística y manufactura.</p>
            </div>
            {(['product','company','legal'] as const).map(section=>(
              <div key={section}>
                <div className="mono" style={{fontSize:11,fontWeight:500,color:TEXT_MUTED,textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:16}}>{t.footer[section]}</div>
                <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
                  {t.footer.links[section].map((link,j)=>(
                    <li key={j}><a href="#" style={{fontSize:13,color:TEXT_FAINT,textDecoration:'none',transition:'color .15s'}}
                      onMouseEnter={e=>(e.target as HTMLAnchorElement).style.color=GREEN}
                      onMouseLeave={e=>(e.target as HTMLAnchorElement).style.color=TEXT_FAINT}>{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{borderTop:`1px solid ${BORDER_SUBTLE}`,paddingTop:24,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:12,color:TEXT_FAINT}}>{t.footer.copy}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}