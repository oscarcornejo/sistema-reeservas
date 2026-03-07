/**
 * @fileoverview Script de seed para poblar la BD con datos de prueba.
 *
 * Crea un ecosistema completo con 8 negocios (uno por cada rubro):
 * - 15 usuarios (8 admin + 8 profesionales + 4 clientes — algunos compartidos)
 * - 8 negocios: Barbería, Spa, Consultorio Dental, Peluquería,
 *   Centro de Estética, Clínica, Centro de Masajes, Salón de Belleza
 * - Servicios, profesionales, clientes y citas distribuidos entre negocios
 * - Todos los estados de cita cubiertos: pending, confirmed, in-progress, completed, cancelled, no-show
 * - 3 suscripciones (professional + trial + enterprise)
 *
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
    // 1. USUARIOS
    // ════════════════════════════════════════════════════════════════════════
    console.log('👤 Creando usuarios...');

    const mkAdmin = (email: string, name: string, phone: string) => ({
        email, password: hashedPassword, name, phone,
        role: 'admin' as const, isActive: true, emailVerified: new Date(),
    });
    const mkPro = (email: string, name: string, phone: string) => ({
        email, password: hashedPassword, name, phone,
        role: 'professional' as const, isActive: true, emailVerified: new Date(),
    });
    const mkClient = (email: string, name: string, phone: string) => ({
        email, password: hashedPassword, name, phone,
        role: 'client' as const, isActive: true, emailVerified: new Date(),
    });

    const [
        adminUser, adminUser2, adminUser3, adminUser4, adminUser5, adminUser6, adminUser7, adminUser8,
        proUser1, proUser2, proUser3, proUser4, proUser5, proUser6, proUser7, proUser8, proUser9,
        clientUser1, clientUser2, clientUser3, clientUser4,
    ] = await User.insertMany([
        // --- Admins (8) ---
        mkAdmin('admin@turnopro.cl', 'Carlos Administrador', '+56 9 1111 2222'),
        mkAdmin('ana@serenityspa.cl', 'Ana Directora', '+56 9 1111 3333'),
        mkAdmin('roberto@dentalcorp.cl', 'Roberto Muñoz', '+56 9 1111 4444'),
        mkAdmin('valentina@pelostyle.cl', 'Valentina Rojas', '+56 9 1111 5555'),
        mkAdmin('ignacio@bellavida.cl', 'Ignacio Paredes', '+56 9 1111 6666'),
        mkAdmin('francisca@clinicavital.cl', 'Francisca Soto', '+56 9 1111 7777'),
        mkAdmin('diego@zenmasajes.cl', 'Diego Contreras', '+56 9 1111 8888'),
        mkAdmin('paula@glamourstudio.cl', 'Paula Mendoza', '+56 9 1111 9999'),
        // --- Profesionales (8) ---
        mkPro('pedro@turnopro.cl', 'Pedro Sanchez', '+56 9 3333 4444'),
        mkPro('laura@turnopro.cl', 'Laura Fernandez', '+56 9 5555 6666'),
        mkPro('camila@serenityspa.cl', 'Camila Reyes', '+56 9 5555 7777'),
        mkPro('sofia@dentalcorp.cl', 'Sofia Herrera', '+56 9 5555 8888'),
        mkPro('nicolas@pelostyle.cl', 'Nicolas Fuentes', '+56 9 5555 9999'),
        mkPro('fernanda@bellavida.cl', 'Fernanda Lopez', '+56 9 6666 1111'),
        mkPro('matias@zenmasajes.cl', 'Matias Araya', '+56 9 6666 2222'),
        mkPro('catalina@glamourstudio.cl', 'Catalina Bravo', '+56 9 6666 3333'),
        mkPro('daniela@clinicavital.cl', 'Daniela Muñoz', '+56 9 6666 4444'),
        // --- Clientes (4) ---
        mkClient('maria@cliente.cl', 'Maria Garcia', '+56 9 7777 8888'),
        mkClient('juan@cliente.cl', 'Juan Torres', '+56 9 9999 0000'),
        mkClient('andrea@cliente.cl', 'Andrea Vidal', '+56 9 8888 1111'),
        mkClient('tomas@cliente.cl', 'Tomas Castillo', '+56 9 8888 2222'),
    ]);

    // ════════════════════════════════════════════════════════════════════════
    // 2. NEGOCIOS (8) — uno por cada rubro
    // ════════════════════════════════════════════════════════════════════════
    console.log('🏢 Creando negocios...');

    const defaultWorkingHours = (openTime = '09:00', closeTime = '19:00', satClose = '14:00') => [
        { dayOfWeek: 0, isOpen: false, openTime: '00:00', closeTime: '00:00' },
        { dayOfWeek: 1, isOpen: true, openTime, closeTime },
        { dayOfWeek: 2, isOpen: true, openTime, closeTime },
        { dayOfWeek: 3, isOpen: true, openTime, closeTime },
        { dayOfWeek: 4, isOpen: true, openTime, closeTime },
        { dayOfWeek: 5, isOpen: true, openTime, closeTime },
        { dayOfWeek: 6, isOpen: true, openTime, closeTime: satClose },
    ];

    const [business1, business2, business3, business4, business5, business6, business7, business8] = await Business.insertMany([
        {
            adminId: adminUser._id,
            name: 'Barbería El Clásico',
            slug: 'barberia-el-clasico',
            description:
                'La mejor barbería de Santiago. Cortes clásicos y modernos con los mejores profesionales.',
            category: 'Barbería',
            address: 'Av. Providencia 1234, Providencia',
            city: 'Santiago',
            state: 'Región Metropolitana',
            country: 'CL',
            location: { type: 'Point', coordinates: [-70.6109, -33.4268] },
            phone: '+56 2 2345 6789',
            email: 'contacto@barberiaclasico.cl',
            website: 'https://barberiaclasico.cl',
            workingHours: defaultWorkingHours('09:00', '20:00', '15:00'),
            subscriptionStatus: 'active',
            subscriptionPlan: 'professional',
            subscriptionExpiresAt: monthsFromNow(6),
            allowOnlinePayments: true,
            cancellationPolicy: 'Cancelaciones con al menos 2 horas de anticipación.',
            isPublished: true,
            theme: 'barberia',
            gallery: [
                'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1200&h=900&fit=crop',
            ],
        },
        {
            adminId: adminUser2._id,
            name: 'Serenity Spa',
            slug: 'serenity-spa',
            description:
                'Centro de estética y bienestar en el corazón de Las Condes. Masajes, faciales y más.',
            category: 'Spa',
            address: 'Av. Apoquindo 5678, Las Condes',
            city: 'Santiago',
            state: 'Región Metropolitana',
            country: 'CL',
            location: { type: 'Point', coordinates: [-70.5770, -33.4103] },
            phone: '+56 2 9876 5432',
            email: 'contacto@serenityspa.cl',
            website: 'https://serenityspa.cl',
            workingHours: defaultWorkingHours('10:00', '19:00', '14:00'),
            subscriptionStatus: 'trial',
            subscriptionPlan: 'starter',
            isPublished: true,
            theme: 'naturaleza',
            gallery: [
                'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1200&h=900&fit=crop',
            ],
        },
        {
            adminId: adminUser3._id,
            name: 'DentalCorp Chile',
            slug: 'dentalcorp-chile',
            description:
                'Clínica dental premium con tecnología de última generación. Ortodoncia, implantes y estética dental.',
            category: 'Consultorio Dental',
            address: 'Av. Las Condes 9876, Las Condes',
            city: 'Santiago',
            state: 'Región Metropolitana',
            country: 'CL',
            location: { type: 'Point', coordinates: [-70.5680, -33.4050] },
            phone: '+56 2 3456 7890',
            email: 'contacto@dentalcorp.cl',
            website: 'https://dentalcorp.cl',
            workingHours: defaultWorkingHours('08:00', '20:00', '14:00'),
            subscriptionStatus: 'active',
            subscriptionPlan: 'enterprise',
            subscriptionExpiresAt: monthsFromNow(12),
            allowOnlinePayments: true,
            requirePaymentUpfront: true,
            cancellationPolicy: 'Cancelaciones con al menos 24 horas de anticipación. Cancelaciones tardías generan un cargo del 50%.',
            isPublished: true,
            theme: 'salud',
            gallery: [
                'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=1200&h=900&fit=crop',
            ],
        },
        // --- 4. Peluquería ---
        {
            adminId: adminUser4._id,
            name: 'PeloStyle',
            slug: 'pelostyle',
            description:
                'Peluquería moderna con especialistas en colorimetría, alisados y cortes de tendencia.',
            category: 'Peluquería',
            address: 'Av. Italia 890, Ñuñoa',
            city: 'Santiago',
            state: 'Región Metropolitana',
            country: 'CL',
            location: { type: 'Point', coordinates: [-70.5950, -33.4520] },
            phone: '+56 2 4567 8901',
            email: 'contacto@pelostyle.cl',
            workingHours: defaultWorkingHours('09:00', '19:00', '14:00'),
            subscriptionStatus: 'active',
            subscriptionPlan: 'professional',
            subscriptionExpiresAt: monthsFromNow(3),
            allowOnlinePayments: true,
            isPublished: true,
            theme: 'estetica',
            gallery: [
                'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1200&h=900&fit=crop',
            ],
        },
        // --- 5. Centro de Estética ---
        {
            adminId: adminUser5._id,
            name: 'Bella Vida Estética',
            slug: 'bella-vida-estetica',
            description:
                'Centro de estética integral. Tratamientos faciales, corporales y depilación láser.',
            category: 'Centro de Estética',
            address: 'Av. Vitacura 4321, Vitacura',
            city: 'Santiago',
            state: 'Región Metropolitana',
            country: 'CL',
            location: { type: 'Point', coordinates: [-70.5840, -33.3920] },
            phone: '+56 2 5678 9012',
            email: 'contacto@bellavida.cl',
            website: 'https://bellavida.cl',
            workingHours: defaultWorkingHours('09:00', '19:00', '14:00'),
            subscriptionStatus: 'active',
            subscriptionPlan: 'professional',
            subscriptionExpiresAt: monthsFromNow(5),
            allowOnlinePayments: true,
            isPublished: true,
            theme: 'estetica',
            gallery: [
                'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1200&h=900&fit=crop',
            ],
        },
        // --- 6. Clínica ---
        {
            adminId: adminUser6._id,
            name: 'Clínica Vital',
            slug: 'clinica-vital',
            description:
                'Clínica médica general con especialistas en dermatología, nutrición y medicina estética.',
            category: 'Clínica',
            address: 'Av. Kennedy 5432, Las Condes',
            city: 'Santiago',
            state: 'Región Metropolitana',
            country: 'CL',
            location: { type: 'Point', coordinates: [-70.5620, -33.3980] },
            phone: '+56 2 6789 0123',
            email: 'contacto@clinicavital.cl',
            website: 'https://clinicavital.cl',
            workingHours: defaultWorkingHours('08:00', '20:00', '13:00'),
            subscriptionStatus: 'active',
            subscriptionPlan: 'enterprise',
            subscriptionExpiresAt: monthsFromNow(8),
            allowOnlinePayments: true,
            requirePaymentUpfront: true,
            cancellationPolicy: 'Cancelaciones con al menos 24 horas de anticipación.',
            isPublished: true,
            theme: 'salud',
            gallery: [
                'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=1200&h=900&fit=crop',
            ],
        },
        // --- 7. Centro de Masajes ---
        {
            adminId: adminUser7._id,
            name: 'Zen Masajes',
            slug: 'zen-masajes',
            description:
                'Centro especializado en masajes terapéuticos, descontracturantes y relajación profunda.',
            category: 'Centro de Masajes',
            address: 'Av. Irarrázaval 2345, Ñuñoa',
            city: 'Santiago',
            state: 'Región Metropolitana',
            country: 'CL',
            location: { type: 'Point', coordinates: [-70.6020, -33.4440] },
            phone: '+56 2 7890 1234',
            email: 'contacto@zenmasajes.cl',
            workingHours: defaultWorkingHours('10:00', '20:00', '15:00'),
            subscriptionStatus: 'active',
            subscriptionPlan: 'starter',
            subscriptionExpiresAt: monthsFromNow(2),
            isPublished: true,
            theme: 'naturaleza',
            gallery: [
                'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1200&h=900&fit=crop',
            ],
        },
        // --- 8. Salón de Belleza ---
        {
            adminId: adminUser8._id,
            name: 'Glamour Studio',
            slug: 'glamour-studio',
            description:
                'Salón de belleza premium. Maquillaje profesional, peinados para eventos y tratamientos capilares.',
            category: 'Salón de Belleza',
            address: 'Av. El Bosque Norte 567, Las Condes',
            city: 'Santiago',
            state: 'Región Metropolitana',
            country: 'CL',
            location: { type: 'Point', coordinates: [-70.5710, -33.4070] },
            phone: '+56 2 8901 2345',
            email: 'contacto@glamourstudio.cl',
            website: 'https://glamourstudio.cl',
            workingHours: defaultWorkingHours('09:00', '20:00', '15:00'),
            subscriptionStatus: 'active',
            subscriptionPlan: 'professional',
            subscriptionExpiresAt: monthsFromNow(4),
            allowOnlinePayments: true,
            isPublished: true,
            theme: 'estetica',
            gallery: [
                'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=900&fit=crop',
                'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1200&h=900&fit=crop',
            ],
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
        { businessId: business3._id, name: 'Estética Dental', order: 3, isActive: true },
        // --- PeloStyle ---
        { businessId: business4._id, name: 'Cortes', order: 1, isActive: true },
        { businessId: business4._id, name: 'Color', order: 2, isActive: true },
        { businessId: business4._id, name: 'Tratamientos', order: 3, isActive: true },
        // --- Bella Vida Estética ---
        { businessId: business5._id, name: 'Faciales', order: 1, isActive: true },
        { businessId: business5._id, name: 'Corporales', order: 2, isActive: true },
        { businessId: business5._id, name: 'Depilación', order: 3, isActive: true },
        // --- Clínica Vital ---
        { businessId: business6._id, name: 'Consultas', order: 1, isActive: true },
        { businessId: business6._id, name: 'Dermatología', order: 2, isActive: true },
        { businessId: business6._id, name: 'Nutrición', order: 3, isActive: true },
        // --- Zen Masajes ---
        { businessId: business7._id, name: 'Masajes Terapéuticos', order: 1, isActive: true },
        { businessId: business7._id, name: 'Relajación', order: 2, isActive: true },
        // --- Glamour Studio ---
        { businessId: business8._id, name: 'Maquillaje', order: 1, isActive: true },
        { businessId: business8._id, name: 'Peinados', order: 2, isActive: true },
        { businessId: business8._id, name: 'Tratamientos', order: 3, isActive: true },
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
            description: 'Blanqueamiento dental con tecnología LED de última generación',
            category: 'Estética Dental',
            duration: 90,
            price: 120000,
            currency: 'CLP',
            isActive: true,
            order: 3,
        },
        // --- PeloStyle (3) --- índices [11..13]
        {
            businessId: business4._id,
            name: 'Corte Mujer',
            description: 'Corte personalizado con lavado y secado',
            category: 'Cortes',
            duration: 45,
            price: 15000,
            currency: 'CLP',
            isActive: true,
            order: 1,
        },
        {
            businessId: business4._id,
            name: 'Balayage',
            description: 'Técnica de coloración degradada con efecto natural',
            category: 'Color',
            duration: 120,
            price: 45000,
            currency: 'CLP',
            isActive: true,
            order: 2,
        },
        {
            businessId: business4._id,
            name: 'Alisado Keratina',
            description: 'Alisado permanente con keratina brasileña',
            category: 'Tratamientos',
            duration: 90,
            price: 35000,
            currency: 'CLP',
            isActive: true,
            order: 3,
        },
        // --- Bella Vida Estética (3) --- índices [14..16]
        {
            businessId: business5._id,
            name: 'Limpieza Facial Profunda',
            description: 'Limpieza con extracción, peeling y máscara hidratante',
            category: 'Faciales',
            duration: 60,
            price: 28000,
            currency: 'CLP',
            isActive: true,
            order: 1,
        },
        {
            businessId: business5._id,
            name: 'Radiofrecuencia Corporal',
            description: 'Tratamiento reafirmante con radiofrecuencia para abdomen y piernas',
            category: 'Corporales',
            duration: 50,
            price: 32000,
            currency: 'CLP',
            isActive: true,
            order: 2,
        },
        {
            businessId: business5._id,
            name: 'Depilación Láser Piernas',
            description: 'Depilación láser definitiva de piernas completas',
            category: 'Depilación',
            duration: 45,
            price: 40000,
            currency: 'CLP',
            isActive: true,
            order: 3,
        },
        // --- Clínica Vital (3) --- índices [17..19]
        {
            businessId: business6._id,
            name: 'Consulta Dermatológica',
            description: 'Evaluación completa de piel con dermatoscopía digital',
            category: 'Dermatología',
            duration: 30,
            price: 35000,
            currency: 'CLP',
            isActive: true,
            order: 1,
        },
        {
            businessId: business6._id,
            name: 'Consulta Nutricional',
            description: 'Evaluación nutricional con plan alimentario personalizado',
            category: 'Nutrición',
            duration: 45,
            price: 30000,
            currency: 'CLP',
            isActive: true,
            order: 2,
        },
        {
            businessId: business6._id,
            name: 'Botox Facial',
            description: 'Aplicación de toxina botulínica para líneas de expresión',
            category: 'Dermatología',
            duration: 30,
            price: 150000,
            currency: 'CLP',
            isActive: true,
            order: 3,
        },
        // --- Zen Masajes (3) --- índices [20..22]
        {
            businessId: business7._id,
            name: 'Masaje Descontracturante',
            description: 'Masaje terapéutico focalizado en zonas de tensión muscular',
            category: 'Masajes Terapéuticos',
            duration: 60,
            price: 22000,
            currency: 'CLP',
            isActive: true,
            order: 1,
        },
        {
            businessId: business7._id,
            name: 'Masaje Piedras Calientes',
            description: 'Terapia de relajación profunda con piedras volcánicas',
            category: 'Relajación',
            duration: 75,
            price: 28000,
            currency: 'CLP',
            isActive: true,
            order: 2,
        },
        {
            businessId: business7._id,
            name: 'Reflexología Podal',
            description: 'Masaje en puntos reflejos del pie para equilibrio corporal',
            category: 'Masajes Terapéuticos',
            duration: 40,
            price: 18000,
            currency: 'CLP',
            isActive: true,
            order: 3,
        },
        // --- Glamour Studio (3) --- índices [23..25]
        {
            businessId: business8._id,
            name: 'Maquillaje Social',
            description: 'Maquillaje profesional para eventos, fiestas y ocasiones especiales',
            category: 'Maquillaje',
            duration: 60,
            price: 25000,
            currency: 'CLP',
            isActive: true,
            order: 1,
        },
        {
            businessId: business8._id,
            name: 'Peinado de Novia',
            description: 'Peinado personalizado para novias con prueba previa incluida',
            category: 'Peinados',
            duration: 90,
            price: 45000,
            currency: 'CLP',
            isActive: true,
            order: 2,
        },
        {
            businessId: business8._id,
            name: 'Hidratación Capilar',
            description: 'Tratamiento de hidratación profunda con mascarilla premium',
            category: 'Tratamientos',
            duration: 45,
            price: 18000,
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

    // Horario genérico: Lun-Vie continuo
    const genericHours = (open = '09:00', close = '19:00') =>
        [1, 2, 3, 4, 5].map((day) => ({
            dayOfWeek: day,
            slots: [{ start: open, end: close }],
        }));

    const [pro1, pro2, pro3, pro4, pro5, pro6, pro7, pro8, pro9] = await Professional.insertMany([
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
            displayName: 'Dra. Sofía Herrera',
            specialties: ['Ortodoncia', 'Estética dental', 'Implantes'],
            bio: 'Odontóloga con magíster en ortodoncia y estética dental. 10 años de experiencia.',
            services: [services[8]._id, services[9]._id, services[10]._id],
            availableHours: clinicHours,
            isActive: true,
            rating: 4.9,
            totalReviews: 215,
        },
        // --- PeloStyle ---
        {
            userId: proUser5._id,
            businessId: business4._id,
            displayName: 'Nicolás Fuentes',
            specialties: ['Colorimetría', 'Cortes de tendencia', 'Alisados'],
            bio: 'Estilista con 8 años de experiencia y certificación en colorimetría avanzada.',
            services: [services[11]._id, services[12]._id, services[13]._id],
            availableHours: genericHours('09:00', '19:00'),
            isActive: true,
            rating: 4.8,
            totalReviews: 96,
        },
        // --- Bella Vida Estética ---
        {
            userId: proUser6._id,
            businessId: business5._id,
            displayName: 'Fernanda López',
            specialties: ['Estética facial', 'Radiofrecuencia', 'Depilación láser'],
            bio: 'Cosmetóloga certificada con especialización en tratamientos anti-edad.',
            services: [services[14]._id, services[15]._id, services[16]._id],
            availableHours: genericHours('09:00', '19:00'),
            isActive: true,
            rating: 4.7,
            totalReviews: 78,
        },
        // --- Clínica Vital ---
        {
            userId: proUser9._id,
            businessId: business6._id,
            displayName: 'Dra. Daniela Muñoz',
            specialties: ['Dermatología', 'Nutrición', 'Medicina estética'],
            bio: 'Médica dermatóloga con subespecialización en medicina estética y nutrición clínica.',
            services: [services[17]._id, services[18]._id, services[19]._id],
            availableHours: clinicHours,
            isActive: true,
            rating: 4.9,
            totalReviews: 143,
        },
        // --- Zen Masajes ---
        {
            userId: proUser7._id,
            businessId: business7._id,
            displayName: 'Matías Araya',
            specialties: ['Masoterapia', 'Reflexología', 'Piedras calientes'],
            bio: 'Masoterapeuta con formación en técnicas orientales y terapia manual.',
            services: [services[20]._id, services[21]._id, services[22]._id],
            availableHours: genericHours('10:00', '20:00'),
            isActive: true,
            rating: 4.9,
            totalReviews: 112,
        },
        // --- Glamour Studio ---
        {
            userId: proUser8._id,
            businessId: business8._id,
            displayName: 'Catalina Bravo',
            specialties: ['Maquillaje social', 'Peinados de novia', 'Tratamientos capilares'],
            bio: 'Maquilladora profesional con experiencia en eventos y producciones.',
            services: [services[23]._id, services[24]._id, services[25]._id],
            availableHours: genericHours('09:00', '20:00'),
            isActive: true,
            rating: 4.8,
            totalReviews: 85,
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
    console.log('\n🔑 Credenciales de acceso (Password: Password123):');
    console.log('  Admins:');
    console.log('    admin@turnopro.cl          → Barbería El Clásico');
    console.log('    ana@serenityspa.cl         → Serenity Spa');
    console.log('    roberto@dentalcorp.cl      → DentalCorp Chile');
    console.log('    valentina@pelostyle.cl     → PeloStyle');
    console.log('    ignacio@bellavida.cl       → Bella Vida Estética');
    console.log('    francisca@clinicavital.cl  → Clínica Vital');
    console.log('    diego@zenmasajes.cl        → Zen Masajes');
    console.log('    paula@glamourstudio.cl     → Glamour Studio');
    console.log('  Profesionales:');
    console.log('    pedro@turnopro.cl, laura@turnopro.cl, camila@serenityspa.cl,');
    console.log('    sofia@dentalcorp.cl, nicolas@pelostyle.cl, fernanda@bellavida.cl,');
    console.log('    matias@zenmasajes.cl, catalina@glamourstudio.cl, daniela@clinicavital.cl');
    console.log('  Clientes:');
    console.log('    maria@cliente.cl, juan@cliente.cl, andrea@cliente.cl, tomas@cliente.cl');

    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Error en seed:', err);
    mongoose.disconnect().finally(() => process.exit(1));
});
