 'use client';
 
import { useEffect, useState } from 'react';
 import { useParams } from 'next/navigation';
 import Link from 'next/link';
 import Sidebar from '../../../components/Sidebar';
 import ThemeToggle from '../../../components/ThemeToggle';
 
interface ResumenRecord {
  fecha: string;
  evento: 'Asistencia' | 'Tardanza' | 'Retiro' | 'Inasistencia';
  justificada: boolean;
}
interface Totals {
  totalIna: number;
  totalTar: number;
  totalRet: number;
  totalJust: number;
}
 
 export default function InasistenciasDetallePage() {
   const params = useParams();
   const studentId = params.id as string;
   const [studentName, setStudentName] = useState('');
  const [studentCourse, setStudentCourse] = useState('');
  const [records, setRecords] = useState<ResumenRecord[]>([]);
   const [loading, setLoading] = useState(true);
  const [yearTotals, setYearTotals] = useState<Totals>({ totalIna: 0, totalTar: 0, totalRet: 0, totalJust: 0 });
  const [allRecords, setAllRecords] = useState<ResumenRecord[]>([]);
  const [monthFilter, setMonthFilter] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const currentYear = new Date().getFullYear().toString();
 
   useEffect(() => {
     const fetchData = async () => {
       try {
         // Fetch student for name
         const studentRes = await fetch(`/api/estudiantes/${studentId}`);
         if (studentRes.ok) {
           const student = await studentRes.json();
           setStudentName(`${student.persona?.lastName || ''}, ${student.persona?.name || ''}`.trim());
          const courseText = student.curso ? `${student.curso.anio}° ${student.curso.division}` : 'Sin Asignar';
          setStudentCourse(courseText);
          if (Array.isArray(student.asistencias_resumen)) {
            const normalized = student.asistencias_resumen.map((r: any) => ({
              fecha: typeof r.fecha === 'string' ? r.fecha : new Date(r.fecha).toISOString().split('T')[0],
              evento: r.evento,
              justificada: !!r.justificada
            }));
            normalized.sort((a: ResumenRecord, b: ResumenRecord) => (a.fecha < b.fecha ? 1 : -1));
            setAllRecords(normalized);
            return;
          }
         }
 
        // Fallback: Fetch attendance records from asistencias API if resumen not present
        const attRes = await fetch(`/api/asistencias?id_alumno=${studentId}`);
        if (attRes.ok) {
          const data = await attRes.json();
          const normalized: ResumenRecord[] = data.map((r: any) => ({
            fecha: typeof r.fecha === 'string' ? r.fecha.split('T')[0] : new Date(r.fecha).toISOString().split('T')[0],
            evento: r.tipo_evento,
            justificada: r.justificacion === 'Justificado'
          }));
          normalized.sort((a: ResumenRecord, b: ResumenRecord) => (a.fecha < b.fecha ? 1 : -1));
          setAllRecords(normalized);
        }
       } catch (e) {
         console.error('Error fetching attendance detail:', e);
       } finally {
         setLoading(false);
       }
     };
 
     if (studentId) fetchData();
   }, [studentId]);
 
  // Calcular totales del año en curso (solo para las cards)
  useEffect(() => {
    const yearRecords = allRecords.filter((r: ResumenRecord) => r.fecha.startsWith(currentYear));
    const totalJust = yearRecords.filter((r: ResumenRecord) => r.justificada).length;
    const totalIna = yearRecords.filter((r: ResumenRecord) => r.evento === 'Inasistencia').length;
    const totalTar = yearRecords.filter((r: ResumenRecord) => r.evento === 'Tardanza').length;
    const totalRet = yearRecords.filter((r: ResumenRecord) => r.evento === 'Retiro').length;
    setYearTotals({ totalIna, totalTar, totalRet, totalJust });
  }, [allRecords, currentYear]);

  // Filtrar registros por mes para la tabla
  useEffect(() => {
    const filtered = allRecords.filter((r: ResumenRecord) => r.fecha.startsWith(monthFilter));
    setRecords(filtered);
    setPage(1);
  }, [allRecords, monthFilter]);

  const valueForType = (rec: ResumenRecord, type: ResumenRecord['evento']) => {
    if (rec.evento !== type) return '0';
    return '1';
  };
 
  const justifiedValue = (rec: ResumenRecord) => {
    if (!rec.justificada) return 0;
     return 1;
   };
 

   return (
     <div className="students-container">
       <Sidebar activePage="estudiantes" />
 
      <main className="students-main">
         <header className="page-header animate-fade-in">
           <div className="header-info">
             <h1>Detalle de Inasistencias</h1>
            <p>
              {studentName ? `Alumno: ${studentName}` : 'Alumno'}
              {studentCourse ? ` — Curso: ${studentCourse}` : ''}
            </p>
           </div>
           <div className="header-actions">
             <ThemeToggle />
             <Link href="/estudiantes" className="btn">Volver al Listado</Link>
           </div>
         </header>
 
         {/* Cards de resumen del año - siempre visibles */}
         {!loading && (
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
             <div className="card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '6px' }}>
               <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Inasistencias</div>
               <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{yearTotals.totalIna || 0}</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Año {currentYear}</div>
             </div>
             <div className="card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '6px' }}>
               <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Tardanzas</div>
               <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{yearTotals.totalTar || 0}</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Año {currentYear}</div>
             </div>
             <div className="card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '6px' }}>
               <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Retiros</div>
               <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{yearTotals.totalRet || 0}</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Año {currentYear}</div>
             </div>
             <div className="card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '6px' }}>
               <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Justificadas</div>
               <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{yearTotals.totalJust || 0}</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Año {currentYear}</div>
             </div>
           </div>
         )}
 
         <div className="table-card">
           {loading ? (
             <div style={{ padding: '40px', textAlign: 'center' }}>Cargando detalle...</div>
           ) : records.length > 0 ? (
            <>
            <table className="students-table">
               <thead>
                 <tr>
                   <th>Fecha</th>
                   <th style={{ textAlign: 'center' }}>Inasistencia</th>
                   <th style={{ textAlign: 'center' }}>Tardanza</th>
                   <th style={{ textAlign: 'center' }}>Retiro</th>
                   <th style={{ textAlign: 'center' }}>Justificadas</th>
                 </tr>
               </thead>
               <tbody>
                {records.slice((page - 1) * pageSize, page * pageSize).map((rec, i) => (
                  <tr key={`${rec.fecha}-${rec.evento}-${i}`}>
                     <td>{rec.fecha}</td>
                     <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-neutral">{valueForType(rec as ResumenRecord, 'Inasistencia')}</span>
                     </td>
                     <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-neutral">{valueForType(rec as ResumenRecord, 'Tardanza')}</span>
                     </td>
                     <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-neutral">{valueForType(rec as ResumenRecord, 'Retiro')}</span>
                     </td>
                     <td style={{ textAlign: 'center' }}>
                      {rec.justificada ? (
                         <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                           {justifiedValue(rec)}
                         </span>
                       ) : (
                         <span className="badge badge-neutral">{justifiedValue(rec)}</span>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             <div className="pagination-controls" style={{ padding: 'var(--spacing-lg)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                 Mostrando {Math.min(pageSize, Math.max(0, records.length - (page - 1) * pageSize))} de {records.length} registros
               </div>
               <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                 <input
                   type="month"
                   className="input month-input"
                   value={monthFilter}
                   onChange={(e) => setMonthFilter(e.target.value)}
                   style={{ padding: 'var(--spacing-xs) var(--spacing-md)', color: 'var(--text-primary)', accentColor: 'var(--text-primary)' }}
                 />
                 <button
                   className="btn"
                   style={{ padding: 'var(--spacing-xs) var(--spacing-md)' }}
                   onClick={() => setPage(p => Math.max(1, p - 1))}
                   disabled={page === 1}
                 >
                   Anterior
                 </button>
                 <div style={{ display: 'flex', alignItems: 'center', padding: '0 var(--spacing-md)', fontWeight: '600' }}>
                   Página {page} de {Math.max(1, Math.ceil(records.length / pageSize))}
                 </div>
                 <button
                   className="btn"
                   style={{ padding: 'var(--spacing-xs) var(--spacing-md)' }}
                   onClick={() => setPage(p => Math.min(Math.ceil(records.length / pageSize), p + 1))}
                   disabled={page >= Math.ceil(records.length / pageSize) || Math.ceil(records.length / pageSize) === 0}
                 >
                   Siguiente
                 </button>
               </div>
             </div>
            </>
           ) : (
             <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
               No hay registros de asistencia para este alumno.
             </div>
           )}
         </div>
       </main>
      <style jsx>{`
        .month-input::-webkit-calendar-picker-indicator {
          filter: brightness(0) saturate(100%);
        }
        @media (prefers-color-scheme: dark) {
          .month-input {
            color: var(--text-primary);
          }
          .month-input::-webkit-calendar-picker-indicator {
            filter: invert(1) brightness(2) saturate(100%);
          }
        }
      `}</style>
     </div>
   );
 }
