export interface Alumno {
    id_alumno: number;
    id_persona: number | bigint;
    legajo: string;
    estado: string;
}

export interface AlumnoWithPersona extends Alumno {
    persona?: {
        name: string | null;
        lastName: string | null;
        dni: string | null;
        email?: string;
    };
}
