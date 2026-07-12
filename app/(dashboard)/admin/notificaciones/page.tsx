'use client'
import { useState } from 'react'
import Icon from '@/components/ui/Icon'

export default function NotificacionesPage() {
  const [testing,  setTesting]  = useState(false)
  const [testResult, setTestResult] = useState<{ok:boolean;message:string}|null>(null)

  const testEmail = async () => {
    setTesting(true)
    setTestResult(null)
    const res  = await fetch('/api/notifications/test', { method: 'POST' })
    const data = await res.json()
    setTestResult(data)
    setTesting(false)
  }

  return (
    <div style={{padding:'24px 28px'}}>
      <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:20}}>
        Notificaciones por email
      </div>

      {/* Eventos configurados */}
      <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden',marginBottom:20}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border2)'}}>
          <div style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>Eventos automáticos</div>
          <div style={{fontSize:12,color:'var(--subtle)',marginTop:2}}>Estas notificaciones se envían automáticamente según los parámetros configurados en Sistema → Configuración</div>
        </div>
        {[
          { icon:'calendar', label:'Auditoría próxima',      desc:'Se envía X días antes de la fecha programada (configurable en "audit_reminder_days")',      recipients:'Admin + Auditor',                   color:'var(--ink)' },
          { icon:'check',    label:'Auditoría completada',   desc:'Se envía al completar una auditoría. Si el score está por debajo del mínimo se marca como crítica', recipients:'Admin + Auditor',           color:'var(--ok)'  },
          { icon:'alert',    label:'Hallazgo crítico',       desc:'Se envía cuando se registra un hallazgo de severidad alta o crítica en una auditoría',       recipients:'Admin + Auditor + Gerente',         color:'var(--err)' },
          { icon:'x',        label:'Hallazgo vencido',       desc:'Se envía cuando un hallazgo supera su fecha límite de resolución',                            recipients:'Admin',                             color:'var(--warn)'},
          { icon:'eye',      label:'Resumen diario',         desc:'Digest automático todos los días a las 8am con auditorías próximas y hallazgos vencidos',     recipients:'Admin',                             color:'var(--ink)' },
        ].map((e,i,arr)=>(
          <div key={e.label} style={{display:'flex',alignItems:'flex-start',gap:14,padding:'14px 20px',borderBottom:i<arr.length-1?'1px solid var(--border2)':'none'}}>
            <div style={{width:32,height:32,borderRadius:'var(--r-sm)',background:`${e.color}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}>
              <Icon name={e.icon as any} size={15} color={e.color}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500,color:'var(--ink)',marginBottom:3}}>{e.label}</div>
              <div style={{fontSize:12,color:'var(--subtle)',lineHeight:1.5,marginBottom:4}}>{e.desc}</div>
              <div style={{fontSize:11,color:'var(--mid)'}}>Destinatarios: <strong>{e.recipients}</strong></div>
            </div>
          </div>
        ))}
      </div>

      {/* Configuración SMTP */}
      <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'20px',marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:500,color:'var(--ink)',marginBottom:6}}>Configuración SMTP</div>
        <div style={{fontSize:12,color:'var(--subtle)',marginBottom:16,lineHeight:1.5}}>
          Los parámetros SMTP se gestionan en <strong>Sistema → Configuración → grupo "email"</strong>. Configura: smtp_host, smtp_port, smtp_user, smtp_password y smtp_from.
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <button onClick={testEmail} disabled={testing} style={{
            display:'flex',alignItems:'center',gap:7,
            background:'var(--accent)',color:'var(--accent-ink)',border:'none',
            padding:'9px 18px',borderRadius:'var(--r-sm)',fontSize:13,
            fontWeight:500,cursor:testing?'default':'pointer',fontFamily:'inherit',
          }}>
            <Icon name="eye" size={13} color="white"/>
            {testing?'Enviando…':'Enviar email de prueba'}
          </button>
          <div style={{fontSize:12,color:'var(--subtle)'}}>Envía un email de prueba a tu cuenta de admin</div>
        </div>
        {testResult&&(
          <div style={{marginTop:12,padding:'10px 14px',borderRadius:'var(--r-sm)',background:testResult.ok?'var(--ok-bg)':'var(--err-bg)',color:testResult.ok?'var(--ok)':'var(--err)',fontSize:12,fontWeight:500}}>
            {testResult.ok?'✅':'❌'} {testResult.message}
          </div>
        )}
      </div>

      {/* Instrucciones Gmail */}
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'20px'}}>
        <div style={{fontSize:13,fontWeight:500,color:'var(--ink)',marginBottom:12}}>Configurar Gmail como remitente</div>
        <ol style={{fontSize:12,color:'var(--mid)',lineHeight:2,margin:0,paddingLeft:20}}>
          <li>Crea o usa una cuenta Gmail dedicada para TVEO</li>
          <li>Activa verificación en 2 pasos en <strong>myaccount.google.com/security</strong></li>
          <li>Ve a <strong>myaccount.google.com/apppasswords</strong> y crea una contraseña de app para "Correo"</li>
          <li>En Configuración del sistema, actualiza los campos del grupo <strong>"email"</strong>:
            <ul style={{marginTop:4,lineHeight:2}}>
              <li><code>smtp_host</code> → <code>smtp.gmail.com</code></li>
              <li><code>smtp_port</code> → <code>587</code></li>
              <li><code>smtp_user</code> → tu dirección Gmail</li>
              <li><code>smtp_password</code> → la contraseña de app de 16 caracteres</li>
              <li><code>smtp_from</code> → <code>TVEO &lt;tu@gmail.com&gt;</code></li>
            </ul>
          </li>
          <li>Activa las notificaciones: <code>notif_email_enabled</code> → <code>true</code></li>
          <li>Haz clic en "Enviar email de prueba" para verificar</li>
        </ol>
      </div>
    </div>
  )
}
