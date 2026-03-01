/**
 * @fileoverview Script de seed para poblar la BD con datos de prueba.
 *
 * Crea un ecosistema completo:
 * - 10 usuarios (3 admin, 4 profesionales, 3 clientes)
 * - 3 negocios (barbería + spa + clínica dental enterprise)
 * - 11 servicios (5 barbería + 3 spa + 3 clínica)
 * - 4 profesionales (2 barbería + 1 spa + 1 clínica)
 * - 4 clientes (2 en barbería + 1 en spa + 1 en clínica)
 * - 14 citas (todos los estados cubiertos: pending, confirmed, in-progress, completed, cancelled, no-show)
 * - 3 suscripciones (professional + trial + enterprise)
 *
 * Admins: admin@turnopro.cl (professional), ana@serenityspa.cl (starter/trial), roberto@dentalcorp.cl (enterprise)
 * Todos los passwords son: Password123
 *
 * Uso: npm run seed
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ─── Importar modelos reales ────────────────────────────────────────────────
// tsx v4+ resuelve @/* paths desde tsconfig.json automáticamente
import User from '../src/lib/db/models/user';
import Business from '../src/lib/db/models/business';
import Service from '../src/lib/db/models/service';
import Professional from '../src/lib/db/models/professional';
import Client from '../src/lib/db/models/client';
import Appointment from '../src/lib/db/models/appointment';
import Subscription from '../src/lib/db/models/subscription';
import ServiceCategory from '../src/lib/db/models/service-category';

// =============================================================================
// Guarda de entorno — NUNCA ejecutar en produccion
// =============================================================================

if (process.env.NODE_ENV === 'production') {
    console.error('❌ PROHIBIDO: No se puede ejecutar el seed en produccion.');
    console.error('   Establece NODE_ENV a "development" o "test" para continuar.');
    process.exit(1);
}

// =============================================================================
// Helpers
// =============================================================================

function daysFromNow(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(0, 0, 0, 0);
    return d;
}

function today(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function monthsFromNow(months: number): Date {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d;
}

// =============================================================================
// Datos de seed
// =============================================================================

const DEFAULT_PASSWORD = 'Password123';

async function seed() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI no esta definida en .env.local');
        process.exit(1);
    }

    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Conectado');

    // ── Limpiar colecciones ────────────────────────────────────────────────
    console.log('🧹 Limpiando colecciones...');
    await Promise.all([
        User.deleteMany({}),
        Business.deleteMany({}),
        Service.deleteMany({}),
        Professional.deleteMany({}),
        Client.deleteMany({}),
        Appointment.deleteMany({}),
        Subscription.deleteMany({}),
        ServiceCategory.deleteMany({}),
    ]);

    // ── Hash del password ──────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    // ════════════════════════════════════════════════════════════════════════
    // 1. USUARIOS (7)
    // ════════════════════════════════════════════════════════════════════════
    console.log('👤 Creando usuarios...');
    const [
        adminUser, adminUser2, adminUser3,
        proUser1, proUser2, proUser3, proUser4,
        clientUser1, clientUser2, clientUser3,
    ] = await User.insertMany([
        {
            email: 'admin@turnopro.cl',
            password: hashedPassword,
            name: 'Carlos Administrador',
            phone: '+56 9 1111 2222',
            role: 'admin',
            isActive: true,
            emailVerified: new Date(),
        },
        {
            email: 'ana@serenityspa.cl',
            password: hashedPassword,
            name: 'Ana Directora',
            phone: '+56 9 1111 3333',
            role: 'admin',
            isActive: true,
            emailVerified: new Date(),
        },
        {
            email: 'roberto@dentalcorp.cl',
            password: hashedPassword,
            name: 'Roberto Muñoz',
            phone: '+56 9 1111 4444',
            role: 'admin',
            isActive: true,
            emailVerified: new Date(),
        },
        {
            email: 'pedro@turnopro.cl',
            password: hashedPassword,
            name: 'Pedro Sanchez',
            phone: '+56 9 3333 4444',
            role: 'professional',
            isActive: true,
            emailVerified: new Date(),
        },
        {
            email: 'laura@turnopro.cl',
            password: hashedPassword,
            name: 'Laura Fernandez',
            phone: '+56 9 5555 6666',
            role: 'professional',
            isActive: true,
            emailVerified: new Date(),
        },
        {
            email: 'camila@serenityspa.cl',
            password: hashedPassword,
            name: 'Camila Reyes',
            phone: '+56 9 5555 7777',
            role: 'professional',
            isActive: true,
            emailVerified: new Date(),
        },
        {
            email: 'sofia@dentalcorp.cl',
            password: hashedPassword,
            name: 'Sofia Herrera',
            phone: '+56 9 5555 8888',
            role: 'professional',
            isActive: true,
            emailVerified: new Date(),
        },
        {
            email: 'maria@cliente.cl',
            password: hashedPassword,
            name: 'Maria Garcia',
            phone: '+56 9 7777 8888',
            role: 'client',
            isActive: true,
            emailVerified: new Date(),
        },
        {
            email: 'juan@cliente.cl',
            password: hashedPassword,
            name: 'Juan Torres',
            phone: '+56 9 9999 0000',
            role: 'client',
            isActive: true,
            emailVerified: new Date(),
        },
        {
            email: 'andrea@cliente.cl',
            password: hashedPassword,
            name: 'Andrea Vidal',
            phone: '+56 9 8888 1111',
            role: 'client',
            isActive: true,
            emailVerified: new Date(),
        },
    ]);

    // ════════════════════════════════════════════════════════════════════════
    // 2. NEGOCIOS (2)
    // ════════════════════════════════════════════════════════════════════════
    console.log('🏢 Creando negocios...');
    const [business1, business2, business3] = await Business.insertMany([
        {
            adminId: adminUser._id,
            name: 'Barberia El Clasico',
            slug: 'barberia-el-clasico',
            description:
                'La mejor barberia de Santiago. Cortes clasicos y modernos con los mejores profesionales.',
            category: 'Barberia',
            address: 'Av. Providencia 1234, Providencia',
            city: 'Santiago',
            state: 'Region Metropolitana',
            country: 'CL',
            location: {
                type: 'Point',
                coordinates: [-70.6109, -33.4268],
            },
            phone: '+56 2 2345 6789',
            email: 'contacto@barberiaclasico.cl',
            website: 'https://barberiaclasico.cl',
            workingHours: [
                { dayOfWeek: 0, isOpen: false, openTime: '00:00', closeTime: '00:00' },
                { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '20:00' },
                { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '20:00' },
                { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '20:00' },
                { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '20:00' },
                { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '20:00' },
                { dayOfWeek: 6, isOpen: true, openTime: '10:00', closeTime: '15:00' },
            ],
            subscriptionStatus: 'active',
            subscriptionPlan: 'professional',
            subscriptionExpiresAt: monthsFromNow(6),
            allowOnlinePayments: true,
            cancellationPolicy: 'Cancelaciones con al menos 2 horas de anticipacion. Cancelaciones tardias pueden generar un cargo.',
            isPublished: true,
        },
        {
            adminId: adminUser2._id,
            name: 'Serenity Spa',
            slug: 'serenity-spa',
            description:
                'Centro de estetica y bienestar en el corazon de Las Condes. Masajes, faciales y mas.',
            category: 'Spa y Estetica',
            address: 'Av. Apoquindo 5678, Las Condes',
            city: 'Santiago',
            state: 'Region Metropolitana',
            country: 'CL',
            location: {
                type: 'Point',
                coordinates: [-70.5770, -33.4103],
            },
            phone: '+56 2 9876 5432',
            email: 'contacto@serenityspa.cl',
            website: 'https://serenityspa.cl',
            workingHours: [
                { dayOfWeek: 0, isOpen: false, openTime: '00:00', closeTime: '00:00' },
                { dayOfWeek: 1, isOpen: true, openTime: '10:00', closeTime: '19:00' },
                { dayOfWeek: 2, isOpen: true, openTime: '10:00', closeTime: '19:00' },
                { dayOfWeek: 3, isOpen: true, openTime: '10:00', closeTime: '19:00' },
                { dayOfWeek: 4, isOpen: true, openTime: '10:00', closeTime: '19:00' },
                { dayOfWeek: 5, isOpen: true, openTime: '10:00', closeTime: '19:00' },
                { dayOfWeek: 6, isOpen: true, openTime: '10:00', closeTime: '14:00' },
            ],
            subscriptionStatus: 'trial',
            subscriptionPlan: 'starter',
            isPublished: true,
        },
        {
            adminId: adminUser3._id,
            name: 'DentalCorp Chile',
            slug: 'dentalcorp-chile',
            description:
                'Clinica dental premium con tecnologia de ultima generacion. Ortodoncia, implantes y estetica dental.',
            category: 'Clinica Dental',
            address: 'Av. Las Condes 9876, Las Condes',
            city: 'Santiago',
            state: 'Region Metropolitana',
            country: 'CL',
            location: {
                type: 'Point',
                coordinates: [-70.5680, -33.4050],
            },
            phone: '+56 2 3456 7890',
            email: 'contacto@dentalcorp.cl',
            website: 'https://dentalcorp.cl',
            workingHours: [
                { dayOfWeek: 0, isOpen: false, openTime: '00:00', closeTime: '00:00' },
                { dayOfWeek: 1, isOpen: true, openTime: '08:00', closeTime: '20:00' },
                { dayOfWeek: 2, isOpen: true, openTime: '08:00', closeTime: '20:00' },
                { dayOfWeek: 3, isOpen: true, openTime: '08:00', closeTime: '20:00' },
                { dayOfWeek: 4, isOpen: true, openTime: '08:00', closeTime: '20:00' },
                { dayOfWeek: 5, isOpen: true, openTime: '08:00', closeTime: '20:00' },
                { dayOfWeek: 6, isOpen: true, openTime: '09:00', closeTime: '14:00' },
            ],
            subscriptionStatus: 'active',
            subscriptionPlan: 'enterprise',
            subscriptionExpiresAt: monthsFromNow(12),
            allowOnlinePayments: true,
            requirePaymentUpfront: true,
            cancellationPolicy: 'Cancelaciones con al menos 24 horas de anticipacion. Cancelaciones tardias generan un cargo del 50%.',
            isPublished: true,
        },
    ]);

    // ════════════════════════════════════════════════════════════════════════
    // 2.5 CATEGORÍAS DE SERVICIO (6)
    // ════════════════════════════════════════════════════════════════════════
    console.log('📂 Creando categorías de servicio...');
    await ServiceCategory.insertMany([
        // --- Barberia El Clasico ---
        { businessId: business1._id, name: 'Cortes', order: 1, isActive: true },
        { businessId: business1._id, name: 'Barba', order: 2, isActive: true },
        { businessId: business1._id, name: 'Tratamientos', order: 3, isActive: true },
        // --- Serenity Spa ---
        { businessId: business2._id, name: 'Masajes', order: 1, isActive: true },
        { businessId: business2._id, name: 'Faciales', order: 2, isActive: true },
        { businessId: business2._id, name: 'Manos y Pies', order: 3, isActive: true },
        // --- DentalCorp Chile ---
        { businessId: business3._id, name: 'Consultas', order: 1, isActive: true },
        { businessId: business3._id, name: 'Ortodoncia', order: 2, isActive: true },
        { businessId: business3._id, name: 'Estetica Dental', order: 3, isActive: true },
    ]);

    // ════════════════════════════════════════════════════════════════════════
    // 3. SERVICIOS (8)
    // ════════════════════════════════════════════════════════════════════════
    console.log('✂️  Creando servicios...');
    const services = await Service.insertMany([
        // --- Barberia El Clasico (5) ---
        {
            businessId: business1._id,
            name: 'Corte Clasico',
            description: 'Corte de pelo tradicional con tijera y maquina',
            category: 'Cortes',
            duration: 30,
            price: 8000,
            currency: 'CLP',
            isActive: true,
            order: 1,
        },
        {
            businessId: business1._id,
            name: 'Corte + Barba',
            description: 'Combo corte de pelo y arreglo de barba completo',
            category: 'Cortes',
            duration: 45,
            price: 12000,
            currency: 'CLP',
            isActive: true,
            order: 2,
        },
        {
            businessId: business1._id,
            name: 'Fade Premium',
            description: 'Degradado moderno con diseno personalizado',
            category: 'Cortes',
            duration: 40,
            price: 10000,
            currency: 'CLP',
            isActive: true,
            order: 3,
        },
        {
            businessId: business1._id,
            name: 'Arreglo de Barba',
            description: 'Perfilado y arreglo de barba con navaja',
            category: 'Barba',
            duration: 20,
            price: 5000,
            currency: 'CLP',
            isActive: true,
            order: 4,
        },
        {
            businessId: business1._id,
            name: 'Tratamiento Capilar',
            description: 'Hidratacion profunda con keratina y masaje',
            category: 'Tratamientos',
            duration: 60,
            price: 15000,
            currency: 'CLP',
            isActive: true,
            order: 5,
        },
        // --- Serenity Spa (3) ---
        {
            businessId: business2._id,
            name: 'Masaje Relajante',
            description: 'Masaje corporal completo con aceites esenciales',
            category: 'Masajes',
            duration: 60,
            price: 25000,
            currency: 'CLP',
            isActive: true,
            order: 1,
        },
        {
            businessId: business2._id,
            name: 'Limpieza Facial',
            description: 'Limpieza profunda con exfoliacion y mascarilla hidratante',
            category: 'Faciales',
            duration: 45,
            price: 18000,
            currency: 'CLP',
            isActive: true,
            order: 2,
        },
        {
            businessId: business2._id,
            name: 'Manicure Spa',
            description: 'Manicure con tratamiento de parafina y esmaltado',
            category: 'Manos y Pies',
            duration: 40,
            price: 12000,
            currency: 'CLP',
            isActive: true,
            order: 3,
        },
        // --- DentalCorp Chile (3) ---
        {
            businessId: business3._id,
            name: 'Consulta General',
            description: 'Evaluacion dental completa con radiografia panoramica',
            category: 'Consultas',
            duration: 30,
            price: 25000,
            currency: 'CLP',
            isActive: true,
            order: 1,
        },
        {
            businessId: business3._id,
            name: 'Limpieza Dental',
            description: 'Limpieza profunda con ultrasonido y pulido',
            category: 'Estetica Dental',
            duration: 45,
            price: 35000,
            currency: 'CLP',
            isActive: true,
            order: 2,
        },
        {
            businessId: business3._id,
            name: 'Blanqueamiento LED',
            description: 'Blanqueamiento dental con tecnologia LED de ultima generacion',
            category: 'Estetica Dental',
            duration: 90,
            price: 120000,
            currency: 'CLP',
            isActive: true,
            order: 3,
        },
    ]);

    // ════════════════════════════════════════════════════════════════════════
    // 4. PROFESIONALES (3)
    // ════════════════════════════════════════════════════════════════════════
    console.log('💇 Creando profesionales...');

    // Horario barberia: Lun-Vie con pausa almuerzo + Sabado mañana
    const barberHours = [
        ...[1, 2, 3, 4, 5].map((day) => ({
            dayOfWeek: day,
            slots: [
                { start: '09:00', end: '13:00' },
                { start: '14:00', end: '20:00' },
            ],
        })),
        { dayOfWeek: 6, slots: [{ start: '10:00', end: '15:00' }] },
    ];

    // Horario spa: Lun-Vie continuo
    const spaHours = [1, 2, 3, 4, 5].map((day) => ({
        dayOfWeek: day,
        slots: [{ start: '10:00', end: '19:00' }],
    }));

    // Horario clínica: Lun-Vie con pausa + Sábado mañana
    const clinicHours = [
        ...[1, 2, 3, 4, 5].map((day) => ({
            dayOfWeek: day,
            slots: [
                { start: '08:00', end: '13:00' },
                { start: '14:00', end: '20:00' },
            ],
        })),
        { dayOfWeek: 6, slots: [{ start: '09:00', end: '14:00' }] },
    ];

    const [pro1, pro2, pro3, pro4] = await Professional.insertMany([
        {
            userId: proUser1._id,
            businessId: business1._id,
            displayName: 'Pedro Sanchez',
            specialties: ['Corte clasico', 'Fade', 'Barba'],
            bio: 'Barbero con 5 anos de experiencia. Especialista en cortes modernos y clasicos.',
            services: [services[0]._id, services[1]._id, services[2]._id, services[3]._id],
            availableHours: barberHours,
            isActive: true,
            rating: 4.9,
            totalReviews: 127,
        },
        {
            userId: proUser2._id,
            businessId: business1._id,
            displayName: 'Laura Fernandez',
            specialties: ['Tratamiento capilar', 'Colorimetria', 'Corte fade'],
            bio: 'Estilista profesional con certificacion internacional en colorimetria.',
            services: [services[2]._id, services[4]._id],
            availableHours: barberHours,
            isActive: true,
            rating: 4.8,
            totalReviews: 89,
        },
        {
            userId: proUser3._id,
            businessId: business2._id,
            displayName: 'Camila Reyes',
            specialties: ['Masajes', 'Faciales', 'Manicure'],
            bio: 'Terapeuta certificada en masoterapia y estetica integral.',
            services: [services[5]._id, services[6]._id, services[7]._id],
            availableHours: spaHours,
            isActive: true,
            rating: 4.7,
            totalReviews: 64,
        },
        {
            userId: proUser4._id,
            businessId: business3._id,
            displayName: 'Dra. Sofia Herrera',
            specialties: ['Ortodoncia', 'Estetica dental', 'Implantes'],
            bio: 'Odontologo con magister en ortodoncia y estetica dental. 10 anos de experiencia.',
            services: [services[8]._id, services[9]._id, services[10]._id],
            availableHours: clinicHours,
            isActive: true,
            rating: 4.9,
            totalReviews: 215,
        },
    ]);

    // ════════════════════════════════════════════════════════════════════════
    // 5. CLIENTES (3)
    // ════════════════════════════════════════════════════════════════════════
    console.log('🧑 Creando clientes...');
    const [client1, client2, client3, client4] = await Client.insertMany([
        {
            userId: clientUser1._id,
            businessId: business1._id,
            name: 'Maria Garcia',
            email: 'maria@cliente.cl',
            phone: '+56 9 7777 8888',
            notes: 'Clienta frecuente, prefiere cortes modernos',
            tags: ['VIP', 'Frecuente'],
            source: 'online',
            totalSpent: 96000,
            totalVisits: 12,
            lastVisit: daysFromNow(-3),
            visitHistory: [
                {
                    date: daysFromNow(-3),
                    serviceName: 'Corte Clasico',
                    professionalName: 'Pedro Sanchez',
                    notes: 'Corte regular, quedo conforme',
                },
                {
                    date: daysFromNow(-10),
                    serviceName: 'Fade Premium',
                    professionalName: 'Laura Fernandez',
                },
                {
                    date: daysFromNow(-17),
                    serviceName: 'Corte + Barba',
                    professionalName: 'Pedro Sanchez',
                },
            ],
        },
        {
            userId: clientUser2._id,
            businessId: business1._id,
            name: 'Juan Torres',
            email: 'juan@cliente.cl',
            phone: '+56 9 9999 0000',
            tags: ['Nuevo'],
            source: 'walk-in',
            totalSpent: 15000,
            totalVisits: 1,
            lastVisit: daysFromNow(-5),
            visitHistory: [
                {
                    date: daysFromNow(-5),
                    serviceName: 'Tratamiento Capilar',
                    professionalName: 'Laura Fernandez',
                    notes: 'Primera visita, buen tratamiento',
                },
            ],
        },
        {
            userId: clientUser1._id,
            businessId: business2._id,
            name: 'Maria Garcia',
            email: 'maria@cliente.cl',
            phone: '+56 9 7777 8888',
            notes: 'Viene por recomendacion',
            tags: ['Nuevo'],
            source: 'referral',
            totalSpent: 25000,
            totalVisits: 1,
            lastVisit: daysFromNow(-7),
            visitHistory: [
                {
                    date: daysFromNow(-7),
                    serviceName: 'Masaje Relajante',
                    professionalName: 'Camila Reyes',
                },
            ],
        },
        {
            userId: clientUser3._id,
            businessId: business3._id,
            name: 'Andrea Vidal',
            email: 'andrea@cliente.cl',
            phone: '+56 9 8888 1111',
            notes: 'Paciente de ortodoncia, control cada 4 semanas',
            tags: ['Frecuente', 'Ortodoncia'],
            source: 'online',
            totalSpent: 310000,
            totalVisits: 8,
            lastVisit: daysFromNow(-5),
            visitHistory: [
                {
                    date: daysFromNow(-5),
                    serviceName: 'Consulta General',
                    professionalName: 'Dra. Sofia Herrera',
                    notes: 'Control de brackets mensual',
                },
                {
                    date: daysFromNow(-35),
                    serviceName: 'Consulta General',
                    professionalName: 'Dra. Sofia Herrera',
                },
                {
                    date: daysFromNow(-60),
                    serviceName: 'Limpieza Dental',
                    professionalName: 'Dra. Sofia Herrera',
                },
            ],
        },
    ]);

    // ════════════════════════════════════════════════════════════════════════
    // 6. CITAS (11) — Todos los estados cubiertos
    // ════════════════════════════════════════════════════════════════════════
    console.log('📅 Creando citas...');
    await Appointment.insertMany([
        // --- Citas de hoy (business 1) ---
        {
            // confirmed — efectivo
            businessId: business1._id,
            clientId: client1._id,
            professionalId: pro1._id,
            serviceId: services[0]._id,
            date: today(),
            startTime: '09:00',
            endTime: '09:30',
            duration: 30,
            status: 'confirmed',
            paymentStatus: 'pending',
            paymentMethod: 'cash',
            paymentAmount: 8000,
            clientNotes: 'Corte igual al anterior por favor',
        },
        {
            // confirmed — tarjeta
            businessId: business1._id,
            clientId: client2._id,
            professionalId: pro1._id,
            serviceId: services[1]._id,
            date: today(),
            startTime: '10:00',
            endTime: '10:45',
            duration: 45,
            status: 'confirmed',
            paymentStatus: 'pending',
            paymentMethod: 'card',
            paymentAmount: 12000,
        },
        {
            // pending
            businessId: business1._id,
            clientId: client1._id,
            professionalId: pro2._id,
            serviceId: services[4]._id,
            date: today(),
            startTime: '11:00',
            endTime: '12:00',
            duration: 60,
            status: 'pending',
            paymentStatus: 'pending',
            paymentAmount: 15000,
        },
        {
            // in-progress — estado faltante
            businessId: business1._id,
            clientId: client2._id,
            professionalId: pro2._id,
            serviceId: services[2]._id,
            date: today(),
            startTime: '14:00',
            endTime: '14:40',
            duration: 40,
            status: 'in-progress',
            paymentStatus: 'pending',
            paymentMethod: 'card',
            paymentAmount: 10000,
            professionalNotes: 'Cliente pidio degradado bajo',
        },
        // --- Citas futuras ---
        {
            // confirmed — futuro
            businessId: business1._id,
            clientId: client1._id,
            professionalId: pro1._id,
            serviceId: services[3]._id,
            date: daysFromNow(1),
            startTime: '16:00',
            endTime: '16:20',
            duration: 20,
            status: 'confirmed',
            paymentStatus: 'pending',
            paymentAmount: 5000,
        },
        {
            // pending — futuro (business 2)
            businessId: business2._id,
            clientId: client3._id,
            professionalId: pro3._id,
            serviceId: services[5]._id,
            date: daysFromNow(2),
            startTime: '11:00',
            endTime: '12:00',
            duration: 60,
            status: 'pending',
            paymentStatus: 'pending',
            paymentAmount: 25000,
        },
        // --- Citas pasadas ---
        {
            // completed — efectivo, con review
            businessId: business1._id,
            clientId: client1._id,
            professionalId: pro1._id,
            serviceId: services[0]._id,
            date: daysFromNow(-3),
            startTime: '10:00',
            endTime: '10:30',
            duration: 30,
            status: 'completed',
            paymentStatus: 'paid',
            paymentMethod: 'cash',
            paymentAmount: 8000,
            rating: 5,
            review: 'Excelente corte como siempre',
            remindersSent: [
                { type: 'email', sentAt: daysFromNow(-4), status: 'sent' },
            ],
        },
        {
            // completed — mercadopago, con review
            businessId: business1._id,
            clientId: client2._id,
            professionalId: pro2._id,
            serviceId: services[4]._id,
            date: daysFromNow(-5),
            startTime: '15:00',
            endTime: '16:00',
            duration: 60,
            status: 'completed',
            paymentStatus: 'paid',
            paymentMethod: 'mercadopago',
            paymentAmount: 15000,
            mercadopagoPaymentId: 'MP-TEST-123456789',
            rating: 4,
            review: 'Muy buen tratamiento, quede conforme',
            remindersSent: [
                { type: 'email', sentAt: daysFromNow(-6), status: 'sent' },
            ],
        },
        {
            // cancelled — con razon
            businessId: business1._id,
            clientId: client2._id,
            professionalId: pro1._id,
            serviceId: services[1]._id,
            date: daysFromNow(-1),
            startTime: '11:00',
            endTime: '11:45',
            duration: 45,
            status: 'cancelled',
            paymentStatus: 'refunded',
            paymentMethod: 'card',
            paymentAmount: 12000,
            cancellationReason: 'Cliente cancelo por motivos personales con 3 horas de anticipacion',
        },
        {
            // no-show — estado faltante
            businessId: business1._id,
            clientId: client1._id,
            professionalId: pro1._id,
            serviceId: services[2]._id,
            date: daysFromNow(-2),
            startTime: '09:00',
            endTime: '09:40',
            duration: 40,
            status: 'no-show',
            paymentStatus: 'pending',
            paymentAmount: 10000,
            professionalNotes: 'No se presento, no aviso',
        },
        {
            // completed — spa (business 2), mercadopago
            businessId: business2._id,
            clientId: client3._id,
            professionalId: pro3._id,
            serviceId: services[5]._id,
            date: daysFromNow(-7),
            startTime: '11:00',
            endTime: '12:00',
            duration: 60,
            status: 'completed',
            paymentStatus: 'paid',
            paymentMethod: 'mercadopago',
            paymentAmount: 25000,
            mercadopagoPaymentId: 'MP-TEST-987654321',
            rating: 5,
            review: 'Increible experiencia, muy relajante',
        },
        // --- Citas DentalCorp (business 3 — enterprise) ---
        {
            // confirmed — hoy
            businessId: business3._id,
            clientId: client4._id,
            professionalId: pro4._id,
            serviceId: services[8]._id,
            date: today(),
            startTime: '10:00',
            endTime: '10:30',
            duration: 30,
            status: 'confirmed',
            paymentStatus: 'pending',
            paymentMethod: 'card',
            paymentAmount: 25000,
            clientNotes: 'Control mensual de brackets',
        },
        {
            // pending — futuro
            businessId: business3._id,
            clientId: client4._id,
            professionalId: pro4._id,
            serviceId: services[10]._id,
            date: daysFromNow(3),
            startTime: '15:00',
            endTime: '16:30',
            duration: 90,
            status: 'pending',
            paymentStatus: 'pending',
            paymentAmount: 120000,
            clientNotes: 'Blanqueamiento post-brackets',
        },
        {
            // completed — pasada, con review
            businessId: business3._id,
            clientId: client4._id,
            professionalId: pro4._id,
            serviceId: services[9]._id,
            date: daysFromNow(-5),
            startTime: '09:00',
            endTime: '09:45',
            duration: 45,
            status: 'completed',
            paymentStatus: 'paid',
            paymentMethod: 'mercadopago',
            paymentAmount: 35000,
            mercadopagoPaymentId: 'MP-TEST-DENTAL-001',
            rating: 5,
            review: 'Excelente atencion, muy profesional la doctora',
            remindersSent: [
                { type: 'email', sentAt: daysFromNow(-6), status: 'sent' },
            ],
        },
    ]);

    // ════════════════════════════════════════════════════════════════════════
    // 7. SUSCRIPCIONES (2)
    // ════════════════════════════════════════════════════════════════════════
    console.log('💳 Creando suscripciones...');
    await Subscription.insertMany([
        {
            businessId: business1._id,
            plan: 'professional',
            status: 'active',
            startDate: monthsFromNow(-6),
            endDate: monthsFromNow(6),
            amount: 19990,
            currency: 'CLP',
            mercadopagoPreapprovalId: 'MP-SUB-TEST-001',
            paymentHistory: [
                {
                    date: monthsFromNow(-6),
                    amount: 19990,
                    status: 'approved',
                    mercadopagoPaymentId: 'MP-PAY-001',
                },
                {
                    date: monthsFromNow(-5),
                    amount: 19990,
                    status: 'approved',
                    mercadopagoPaymentId: 'MP-PAY-002',
                },
                {
                    date: monthsFromNow(-4),
                    amount: 19990,
                    status: 'approved',
                    mercadopagoPaymentId: 'MP-PAY-003',
                },
            ],
        },
        {
            businessId: business2._id,
            plan: 'starter',
            status: 'pending',
            startDate: today(),
            endDate: daysFromNow(14),
            amount: 0,
            currency: 'CLP',
        },
        {
            businessId: business3._id,
            plan: 'enterprise',
            status: 'active',
            startDate: monthsFromNow(-12),
            endDate: monthsFromNow(12),
            amount: 49990,
            currency: 'CLP',
            mercadopagoPreapprovalId: 'MP-SUB-TEST-003',
            paymentHistory: [
                {
                    date: monthsFromNow(-12),
                    amount: 49990,
                    status: 'approved',
                    mercadopagoPaymentId: 'MP-PAY-ENT-001',
                },
                {
                    date: monthsFromNow(-11),
                    amount: 49990,
                    status: 'approved',
                    mercadopagoPaymentId: 'MP-PAY-ENT-002',
                },
                {
                    date: monthsFromNow(-10),
                    amount: 49990,
                    status: 'approved',
                    mercadopagoPaymentId: 'MP-PAY-ENT-003',
                },
                {
                    date: monthsFromNow(-9),
                    amount: 49990,
                    status: 'approved',
                    mercadopagoPaymentId: 'MP-PAY-ENT-004',
                },
                {
                    date: monthsFromNow(-8),
                    amount: 49990,
                    status: 'approved',
                    mercadopagoPaymentId: 'MP-PAY-ENT-005',
                },
                {
                    date: monthsFromNow(-7),
                    amount: 49990,
                    status: 'approved',
                    mercadopagoPaymentId: 'MP-PAY-ENT-006',
                },
            ],
        },
    ]);

    // ════════════════════════════════════════════════════════════════════════
    // RESUMEN
    // ════════════════════════════════════════════════════════════════════════
    const counts = {
        usuarios: await User.countDocuments(),
        negocios: await Business.countDocuments(),
        servicios: await Service.countDocuments(),
        profesionales: await Professional.countDocuments(),
        clientes: await Client.countDocuments(),
        citas: await Appointment.countDocuments(),
        suscripciones: await Subscription.countDocuments(),
        categorias: await ServiceCategory.countDocuments(),
    };

    console.log('\n🎉 Seed completado exitosamente!\n');
    console.log('📊 Resumen:');
    console.table(counts);
    console.log('\n🔑 Credenciales de acceso:');
    console.log('┌──────────────────────────────────┬──────────────────────────┬────────────────┐');
    console.log('│ Rol                              │ Email                    │ Password       │');
    console.log('├──────────────────────────────────┼──────────────────────────┼────────────────┤');
    console.log('│ Admin (Barberia - professional)  │ admin@turnopro.cl        │ Password123    │');
    console.log('│ Admin (Spa - starter/trial)      │ ana@serenityspa.cl       │ Password123    │');
    console.log('│ Admin (Dental - enterprise)      │ roberto@dentalcorp.cl    │ Password123    │');
    console.log('│ Profesional (Pedro)              │ pedro@turnopro.cl        │ Password123    │');
    console.log('│ Profesional (Laura)              │ laura@turnopro.cl        │ Password123    │');
    console.log('│ Profesional (Camila)             │ camila@serenityspa.cl    │ Password123    │');
    console.log('│ Profesional (Sofia)              │ sofia@dentalcorp.cl      │ Password123    │');
    console.log('│ Cliente (Maria)                  │ maria@cliente.cl         │ Password123    │');
    console.log('│ Cliente (Juan)                   │ juan@cliente.cl          │ Password123    │');
    console.log('│ Cliente (Andrea)                 │ andrea@cliente.cl        │ Password123    │');
    console.log('└──────────────────────────────────┴──────────────────────────┴────────────────┘');

    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Error en seed:', err);
    mongoose.disconnect().finally(() => process.exit(1));
});
