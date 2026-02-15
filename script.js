// ============================================
// CONFIGURACIÓN DE FIREBASE
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyChlvzQkRLjKOBy2C3hLx0xpgG2vGuYi9A",
  authDomain: "petcare-pro-8c93a.firebaseapp.com",
  projectId: "petcare-pro-8c93a",
  storageBucket: "petcare-pro-8c93a.firebasestorage.app",
  messagingSenderId: "351372735622",
  appId: "1:351372735622:web:15d6d07f0fef90f6e10d07"
};

// Inicializar Firebase (SIN STORAGE)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Email del administrador
const ADMIN_EMAIL = "santiagoramirezlanda@gmail.com";

// ============================================
// VARIABLES GLOBALES
// ============================================
let currentUser = null;
let currentUserData = null;
let uploadedPhotoFile = null; // Ahora guarda base64 comprimido
let uploadedAddPhotoFile = null; // Ahora guarda base64 comprimido
let isProcessing = false;

// Base de datos de razas
const razas = [
    {
        id: 1,
        nombre: "Labrador",
        pesoPromedio: "25-36 kg",
        altura: "55-62 cm",
        esperanzaVida: "10-12 años",
        temperamento: "Amigable, activo, leal",
        cuidados: "Requiere ejercicio diario intenso, propenso a obesidad, necesita entrenamiento constante.",
        enfermedadesComunes: ["Displasia de cadera", "Obesidad", "Problemas oculares"],
        icon: "🦮"
    },
    {
        id: 2,
        nombre: "Pastor Alemán",
        pesoPromedio: "30-40 kg",
        altura: "55-65 cm",
        esperanzaVida: "9-13 años",
        temperamento: "Inteligente, protector, trabajador",
        cuidados: "Necesita mucho ejercicio y estimulación mental, entrenamiento desde cachorro, cepillado regular.",
        enfermedadesComunes: ["Displasia de cadera", "Mielopatía degenerativa", "Problemas digestivos"],
        icon: "🐕"
    },
    {
        id: 3,
        nombre: "Golden Retriever",
        pesoPromedio: "27-36 kg",
        altura: "51-61 cm",
        esperanzaVida: "10-12 años",
        temperamento: "Gentil, inteligente, confiable",
        cuidados: "Ejercicio diario moderado a intenso, cepillado frecuente, socialización temprana.",
        enfermedadesComunes: ["Displasia de cadera", "Cáncer", "Problemas cardíacos"],
        icon: "🦴"
    },
    {
        id: 4,
        nombre: "Bulldog Francés",
        pesoPromedio: "9-12 kg",
        altura: "28-33 cm",
        esperanzaVida: "10-12 años",
        temperamento: "Juguetón, adaptable, afectuoso",
        cuidados: "Ejercicio moderado, sensible al calor, limpieza de pliegues faciales.",
        enfermedadesComunes: ["Síndrome braquicefálico", "Problemas de columna", "Alergias cutáneas"],
        icon: "🐶"
    },
    {
        id: 5,
        nombre: "Chihuahua",
        pesoPromedio: "1.5-3 kg",
        altura: "15-23 cm",
        esperanzaVida: "12-20 años",
        temperamento: "Alerta, valiente, devoto",
        cuidados: "Proteger del frío, cuidado dental importante, ejercicio ligero.",
        enfermedadesComunes: ["Problemas dentales", "Hipoglucemia", "Luxación patelar"],
        icon: "🐕‍🦺"
    },
    {
        id: 6,
        nombre: "Mestizo pequeño",
        pesoPromedio: "9-11 kg",
        altura: "33-41 cm",
        esperanzaVida: "12-15 años",
        temperamento: "Curioso, amigable, determinado",
        cuidados: "Ejercicio regular, control de peso, entrenamiento de obediencia.",
        enfermedadesComunes: ["Obesidad", "moquillo", "problemas cardiacos"],
        icon: "🐾"
    },
    {
        id: 7,
        nombre: "Pitbull",
        pesoPromedio: "18-30 kg",
        altura: "43-53 cm",
        esperanzaVida: "12-14 años",
        temperamento: "Leal, valiente, enérgico",
        cuidados: "Ejercicio intenso diario, socialización temprana, entrenamiento consistente.",
        enfermedadesComunes: ["Displasia de cadera", "Alergias cutáneas", "Hipotiroidismo"],
        icon: "💪"
    },
    {
        id: 8,
        nombre: "Poodle",
        pesoPromedio: "20-32 kg",
        altura: "45-60 cm",
        esperanzaVida: "12-15 años",
        temperamento: "Inteligente, activo, elegante",
        cuidados: "Peluquería regular, ejercicio diario, estimulación mental constante.",
        enfermedadesComunes: ["Problemas oculares", "Displasia de cadera", "Epilepsia"],
        icon: "🎀"
    }
];

// ============================================
// LOADING OVERLAY
// ============================================
function showLoading(message = 'Cargando...') {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p id="loading-message">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        document.getElementById('loading-message').textContent = message;
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// ============================================
// COMPRESIÓN AUTOMÁTICA DE IMÁGENES
// ============================================
function compressImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calcular nuevas dimensiones manteniendo el aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width *= maxWidth / height;
                        height = maxWidth;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir a base64 comprimido
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                
                // Calcular tamaño
                const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
                const compressedSizeKB = Math.round((compressedBase64.length * 3) / 4 / 1024);
                console.log(`📸 Imagen comprimida: ${originalSizeMB}MB → ${compressedSizeKB}KB`);
                
                resolve(compressedBase64);
            };
            
            img.onerror = (error) => {
                reject(error);
            };
        };
        
        reader.onerror = (error) => {
            reject(error);
        };
    });
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    loadBreedsInfo();
    
    // Observer del estado de autenticación
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            showLoading('Cargando tu perfil...');
            currentUser = user;
            
            try {
                // Cargar datos del usuario
                const userDoc = await db.collection('users').doc(user.uid).get();
                
                if (!userDoc.exists) {
                    // Si el documento no existe, crearlo ahora
                    await db.collection('users').doc(user.uid).set({
                        name: user.displayName || 'Usuario',
                        email: user.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        onboardingCompleted: false
                    });
                    currentUserData = {
                        name: user.displayName || 'Usuario',
                        email: user.email,
                        onboardingCompleted: false
                    };
                } else {
                    currentUserData = userDoc.data();
                }
                
                // Verificar si necesita onboarding
                if (!currentUserData.onboardingCompleted) {
                    hideLoading();
                    showOnboarding();
                } else {
                    hideLoading();
                    showDashboard();
                }
            } catch (error) {
                console.error('Error cargando usuario:', error);
                hideLoading();
                showToast('Error', 'No se pudo cargar tu perfil', 'error');
            }
        } else {
            currentUser = null;
            currentUserData = null;
            hideLoading();
            showLanding();
        }
    });
});

// ============================================
// NAVEGACIÓN ENTRE SECCIONES PRINCIPALES
// ============================================
function showLanding() {
    hideAllSections();
    document.getElementById('landing-section').classList.add('active');
}

function showOnboarding() {
    hideAllSections();
    document.getElementById('onboarding-section').classList.add('active');
    document.getElementById('onboarding-user-name').textContent = currentUser.displayName || 'Amigo';
}

function showDashboard() {
    hideAllSections();
    document.getElementById('dashboard-section').classList.add('active');
    document.getElementById('user-name-display').textContent = currentUser.displayName || currentUser.email;
    
    // Cargar datos
    loadUserPets();
    loadPetsIntoSelects();
    
    // Mostrar sección de mis mascotas por defecto
    showSectionInternal('my-pets');
}

function hideAllSections() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
}

// ============================================
// MODAL DE AUTENTICACIÓN
// ============================================
function showAuthModal(type) {
    const modal = document.getElementById('auth-modal');
    modal.classList.add('active');
    
    if (type === 'login') {
        document.getElementById('modal-login-form').style.display = 'block';
        document.getElementById('modal-register-form').style.display = 'none';
    } else {
        document.getElementById('modal-login-form').style.display = 'none';
        document.getElementById('modal-register-form').style.display = 'block';
    }
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('active');
}

function switchAuthModal(type) {
    if (type === 'login') {
        document.getElementById('modal-login-form').style.display = 'block';
        document.getElementById('modal-register-form').style.display = 'none';
    } else {
        document.getElementById('modal-login-form').style.display = 'none';
        document.getElementById('modal-register-form').style.display = 'block';
    }
}

// Click fuera del modal para cerrarlo
document.addEventListener('click', function(e) {
    const modal = document.getElementById('auth-modal');
    if (e.target === modal) {
        closeAuthModal();
    }
});

// ============================================
// AUTENTICACIÓN
// ============================================
async function handleRegister(event) {
    event.preventDefault();
    
    if (isProcessing) return false;
    isProcessing = true;
    
    const name = document.getElementById('modal-register-name').value.trim();
    const email = document.getElementById('modal-register-email').value.trim();
    const password = document.getElementById('modal-register-password').value;
    
    showLoading('Creando tu cuenta...');
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            onboardingCompleted: false
        });
        
        hideLoading();
        showToast('¡Cuenta creada!', 'Bienvenido a PetCare Pro', 'success');
        closeAuthModal();
        
    } catch (error) {
        console.error('Error en registro:', error);
        hideLoading();
        showToast('Error', getErrorMessage(error.code), 'error');
    } finally {
        isProcessing = false;
    }
    
    return false;
}

async function handleLogin(event) {
    event.preventDefault();
    
    if (isProcessing) return false;
    isProcessing = true;
    
    const email = document.getElementById('modal-login-email').value.trim();
    const password = document.getElementById('modal-login-password').value;
    
    showLoading('Iniciando sesión...');
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        
        hideLoading();
        showToast('¡Bienvenido!', 'Iniciando sesión...', 'success');
        closeAuthModal();
        
    } catch (error) {
        console.error('Error en login:', error);
        hideLoading();
        showToast('Error', getErrorMessage(error.code), 'error');
    } finally {
        isProcessing = false;
    }
    
    return false;
}

function handleLogout() {
    showLoading('Cerrando sesión...');
    auth.signOut().then(() => {
        hideLoading();
        showToast('Sesión cerrada', 'Hasta pronto', 'info');
    }).catch(error => {
        hideLoading();
        showToast('Error', 'No se pudo cerrar sesión', 'error');
    });
}

function getErrorMessage(code) {
    const messages = {
        'auth/email-already-in-use': 'Este correo ya está registrado',
        'auth/invalid-email': 'Correo electrónico inválido',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet'
    };
    return messages[code] || 'Ocurrió un error. Intenta de nuevo.';
}

// ============================================
// PREVIEW DE FOTOS CON COMPRESIÓN AUTOMÁTICA
// ============================================
async function previewPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Archivo inválido', 'Por favor selecciona una imagen', 'error');
        event.target.value = '';
        return;
    }
    
    try {
        showLoading('Procesando imagen...');
        
        const compressedBase64 = await compressImage(file);
        uploadedPhotoFile = compressedBase64;
        
        const preview = document.getElementById('photo-preview');
        preview.innerHTML = `<img src="${compressedBase64}" alt="Preview">`;
        
        hideLoading();
        showToast('Imagen lista', 'Foto procesada correctamente', 'success');
        
    } catch (error) {
        console.error('Error procesando imagen:', error);
        hideLoading();
        showToast('Error', 'No se pudo procesar la imagen', 'error');
        event.target.value = '';
    }
}

async function previewAddPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Archivo inválido', 'Por favor selecciona una imagen', 'error');
        event.target.value = '';
        return;
    }
    
    try {
        showLoading('Procesando imagen...');
        
        const compressedBase64 = await compressImage(file);
        uploadedAddPhotoFile = compressedBase64;
        
        const preview = document.getElementById('add-photo-preview');
        preview.innerHTML = `<img src="${compressedBase64}" alt="Preview">`;
        
        hideLoading();
        showToast('Imagen lista', 'Foto procesada correctamente', 'success');
        
    } catch (error) {
        console.error('Error procesando imagen:', error);
        hideLoading();
        showToast('Error', 'No se pudo procesar la imagen', 'error');
        event.target.value = '';
    }
}

// ============================================
// ONBOARDING
// ============================================
async function handleOnboarding(event) {
    event.preventDefault();
    
    if (isProcessing) return false;
    isProcessing = true;
    
    const name = document.getElementById('onboard-pet-name').value.trim();
    const breed = document.getElementById('onboard-pet-breed').value;
    const weight = parseFloat(document.getElementById('onboard-pet-weight').value);
    const age = parseFloat(document.getElementById('onboard-pet-age').value);
    const activity = document.getElementById('onboard-pet-activity').value;
    
    console.log('🐕 Iniciando registro de mascota:', name);
    showLoading('Guardando información...');
    
    try {
        const photoBase64 = uploadedPhotoFile;
        
        const petData = {
            userId: currentUser.uid,
            name: name,
            breed: breed,
            weight: weight,
            age: age,
            activity: activity,
            photoURL: photoBase64 || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection('pets').add(petData);
        console.log('✅ Mascota guardada con ID:', docRef.id);
        
        await db.collection('users').doc(currentUser.uid).update({
            onboardingCompleted: true
        });
        console.log('✅ Onboarding completado');
        
        hideLoading();
        showToast('¡Mascota registrada!', `${name} ha sido agregado exitosamente`, 'success');
        
        currentUserData.onboardingCompleted = true;
        uploadedPhotoFile = null;
        
        setTimeout(() => showDashboard(), 1000);
        
    } catch (error) {
        console.error('❌ Error en onboarding:', error);
        hideLoading();
        showToast('Error', error.message || 'No se pudo registrar la mascota', 'error');
    } finally {
        isProcessing = false;
    }
    
    return false;
}

// ============================================
// NAVEGACIÓN DEL DASHBOARD
// ============================================
function showSection(sectionName) {
    showSectionInternal(sectionName);
}

function showSectionInternal(sectionName) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    document.getElementById(sectionName + '-section').classList.add('active');
    
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    navBtns.forEach(btn => {
        if (btn.onclick && btn.onclick.toString().includes(sectionName)) {
            btn.classList.add('active');
        }
    });
    
    if (sectionName === 'my-pets') {
        loadUserPets();
    } else if (sectionName === 'food-calculator') {
        loadPetsIntoSelects();
    }
}

// ============================================
// GESTIÓN DE MASCOTAS
// ============================================
async function handleAddPet(event) {
    event.preventDefault();
    
    if (isProcessing) return false;
    isProcessing = true;
    
    const name = document.getElementById('add-pet-name').value.trim();
    const breed = document.getElementById('add-pet-breed').value;
    const weight = parseFloat(document.getElementById('add-pet-weight').value);
    const age = parseFloat(document.getElementById('add-pet-age').value);
    const activity = document.getElementById('add-pet-activity').value;
    
    console.log('🐕 Agregando mascota:', name);
    showLoading('Guardando información...');
    
    try {
        const photoBase64 = uploadedAddPhotoFile;
        
        const petData = {
            userId: currentUser.uid,
            name: name,
            breed: breed,
            weight: weight,
            age: age,
            activity: activity,
            photoURL: photoBase64 || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection('pets').add(petData);
        console.log('✅ Mascota guardada con ID:', docRef.id);
        
        hideLoading();
        showToast('¡Mascota agregada!', `${name} ha sido agregado exitosamente`, 'success');
        
        document.getElementById('add-pet-form').reset();
        document.getElementById('add-photo-preview').innerHTML = '<i class="fas fa-camera"></i>';
        uploadedAddPhotoFile = null;
        
        setTimeout(() => showSectionInternal('my-pets'), 1000);
        
    } catch (error) {
        console.error('❌ Error agregando mascota:', error);
        hideLoading();
        showToast('Error', error.message || 'No se pudo agregar la mascota', 'error');
    } finally {
        isProcessing = false;
    }
    
    return false;
}

async function loadUserPets() {
    const petsGrid = document.getElementById('pets-grid');
    petsGrid.innerHTML = '<div style="text-align: center; padding: 40px; color: #6B7280;"><i class="fas fa-spinner fa-spin" style="font-size: 48px; margin-bottom: 15px;"></i><p>Cargando mascotas...</p></div>';
    
    try {
        const snapshot = await db.collection('pets')
            .where('userId', '==', currentUser.uid)
            .get();
        
        if (snapshot.empty) {
            petsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-dog"></i>
                    <h3>No tienes mascotas registradas</h3>
                    <p>Agrega tu primera mascota para empezar</p>
                    <button class="btn btn-success" onclick="showSectionInternal('add-pet')">
                        <i class="fas fa-plus-circle"></i>
                        Agregar mi primera mascota
                    </button>
                </div>
            `;
            return;
        }
        
        const pets = [];
        snapshot.forEach(doc => {
            pets.push({ id: doc.id, data: doc.data() });
        });
        
        pets.sort((a, b) => {
            const dateA = a.data.createdAt ? a.data.createdAt.toMillis() : 0;
            const dateB = b.data.createdAt ? b.data.createdAt.toMillis() : 0;
            return dateB - dateA;
        });
        
        let petsHTML = '';
        pets.forEach(pet => {
            petsHTML += createPetCard(pet.id, pet.data);
        });
        
        petsGrid.innerHTML = petsHTML;
        
    } catch (error) {
        console.error('Error cargando mascotas:', error);
        petsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle" style="color: var(--danger);"></i>
                <h3>Error al cargar mascotas</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadUserPets()">
                    <i class="fas fa-redo"></i>
                    Reintentar
                </button>
            </div>
        `;
    }
}

function createPetCard(petId, pet) {
    const photoHTML = pet.photoURL 
        ? `<img src="${pet.photoURL}" alt="${pet.name}" class="pet-photo">`
        : `<div class="pet-icon"><i class="fas fa-dog"></i></div>`;
    
    return `
        <div class="pet-card">
            <div class="pet-card-header">
                ${photoHTML}
                <div class="pet-card-title">
                    <h3>${pet.name}</h3>
                    <p>${pet.breed}</p>
                </div>
            </div>
            <div class="pet-info">
                <div class="pet-info-item">
                    <i class="fas fa-weight"></i>
                    <strong>Peso:</strong>
                    <span>${pet.weight} kg</span>
                </div>
                <div class="pet-info-item">
                    <i class="fas fa-calendar"></i>
                    <strong>Edad:</strong>
                    <span>${pet.age} años</span>
                </div>
                <div class="pet-info-item">
                    <i class="fas fa-running"></i>
                    <strong>Actividad:</strong>
                    <span>${getActivityLabel(pet.activity)}</span>
                </div>
            </div>
            <div class="pet-card-actions">
                <button class="btn btn-danger" onclick="deletePet('${petId}', '${pet.name}')">
                    <i class="fas fa-trash"></i>
                    Eliminar
                </button>
            </div>
        </div>
    `;
}

async function deletePet(petId, petName) {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${petName}?`)) return;
    
    showLoading('Eliminando mascota...');
    
    try {
        await db.collection('pets').doc(petId).delete();
        hideLoading();
        showToast('Mascota eliminada', `${petName} ha sido eliminado`, 'info');
        loadUserPets();
    } catch (error) {
        console.error('Error eliminando mascota:', error);
        hideLoading();
        showToast('Error', 'No se pudo eliminar la mascota', 'error');
    }
}

function getActivityLabel(activity) {
    const labels = {
        'cachorro': 'Cachorro (Muy activo)',
        'activo': 'Adulto Activo',
        'normal': 'Adulto Normal',
        'sedentario': 'Adulto Sedentario',
        'senior': 'Senior'
    };
    return labels[activity] || activity;
}

function getActivityFactor(activity) {
    const factors = {
        'cachorro': 2.0,
        'activo': 1.6,
        'normal': 1.4,
        'sedentario': 1.2,
        'senior': 1.0
    };
    return factors[activity] || 1.4;
}

// ============================================
// CALCULADORA DE COMIDA
// ============================================
async function loadPetsIntoSelects() {
    const select = document.getElementById('food-select-pet');
    select.innerHTML = '<option value="">Seleccionar o ingresar manualmente</option>';
    
    try {
        const snapshot = await db.collection('pets')
            .where('userId', '==', currentUser.uid)
            .get();
        
        snapshot.forEach(doc => {
            const pet = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${pet.name} (${pet.weight}kg - ${getActivityLabel(pet.activity)})`;
            option.dataset.weight = pet.weight;
            option.dataset.activity = getActivityFactor(pet.activity);
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando mascotas:', error);
    }
}

function loadPetDataFood() {
    const select = document.getElementById('food-select-pet');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.dataset.weight) {
        document.getElementById('food-weight').value = selectedOption.dataset.weight;
        document.getElementById('food-activity').value = selectedOption.dataset.activity;
    }
}

function calculateFood() {
    const weight = parseFloat(document.getElementById('food-weight').value);
    const activityFactor = parseFloat(document.getElementById('food-activity').value);
    
    if (!weight || weight <= 0) {
        showToast('Error', 'Por favor ingresa un peso válido', 'error');
        return;
    }
    
    const dailyGrams = Math.round(weight * activityFactor * 30);
    const perMeal = Math.round(dailyGrams / 2);
    const dailyKg = (dailyGrams / 1000).toFixed(2);
    
    const resultDiv = document.getElementById('food-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <div class="result-header">
            <h3>Resultado del Cálculo</h3>
        </div>
        <div class="result-main">
            <div class="result-value">${dailyGrams}g</div>
            <div class="result-label">Cantidad diaria total</div>
        </div>
        <div class="result-grid">
            <div class="result-item">
                <div class="result-item-value">${perMeal}g</div>
                <div class="result-item-label">Por comida (2x día)</div>
            </div>
            <div class="result-item">
                <div class="result-item-value">${dailyKg}kg</div>
                <div class="result-item-label">Total en kilogramos</div>
            </div>
        </div>
        <div class="result-recommendations">
            <h4><i class="fas fa-lightbulb"></i> Recomendaciones</h4>
            <ul>
                <li>Divide la porción en 2 comidas diarias (mañana y tarde)</li>
                <li>Ajusta la cantidad según el peso ideal de tu mascota</li>
                <li>Mantén agua fresca disponible en todo momento</li>
                <li>Consulta con tu veterinario para dietas especiales</li>
                <li>Monitorea el peso regularmente para ajustar porciones</li>
            </ul>
        </div>
    `;
    
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// INFORMACIÓN DE RAZAS
// ============================================
function loadBreedsInfo() {
    const breedsGrid = document.getElementById('breeds-grid');
    
    breedsGrid.innerHTML = razas.map(raza => `
        <div class="breed-card" onclick="showBreedDetail(${raza.id})">
            <div class="breed-image">
                <span style="font-size: 80px;">${raza.icon}</span>
            </div>
            <div class="breed-content">
                <h3>${raza.nombre}</h3>
                <div class="breed-tags">
                    <span class="breed-tag">${raza.pesoPromedio}</span>
                    <span class="breed-tag">${raza.esperanzaVida}</span>
                </div>
                <p class="breed-description">${raza.temperamento}</p>
                <button class="btn btn-primary btn-sm">
                    <i class="fas fa-info-circle"></i>
                    Ver detalles
                </button>
            </div>
        </div>
    `).join('');
}

function showBreedDetail(breedId) {
    const raza = razas.find(r => r.id === breedId);
    if (!raza) return;
    
    const modal = document.getElementById('breed-modal');
    const modalBody = document.getElementById('breed-modal-body');
    
    modalBody.innerHTML = `
        <div style="padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 100px; margin-bottom: 20px;">${raza.icon}</div>
                <h2 style="font-size: 32px; font-weight: 800; color: var(--dark); margin-bottom: 10px;">${raza.nombre}</h2>
                <p style="color: var(--gray); font-size: 16px;">${raza.temperamento}</p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div style="background: var(--light-gray); padding: 20px; border-radius: 12px; text-align: center;">
                    <i class="fas fa-weight" style="font-size: 24px; color: var(--primary); margin-bottom: 10px;"></i>
                    <h4 style="font-size: 14px; color: var(--gray); margin-bottom: 5px;">Peso Promedio</h4>
                    <p style="font-size: 18px; font-weight: 700; color: var(--dark);">${raza.pesoPromedio}</p>
                </div>
                <div style="background: var(--light-gray); padding: 20px; border-radius: 12px; text-align: center;">
                    <i class="fas fa-ruler-vertical" style="font-size: 24px; color: var(--primary); margin-bottom: 10px;"></i>
                    <h4 style="font-size: 14px; color: var(--gray); margin-bottom: 5px;">Altura</h4>
                    <p style="font-size: 18px; font-weight: 700; color: var(--dark);">${raza.altura}</p>
                </div>
                <div style="background: var(--light-gray); padding: 20px; border-radius: 12px; text-align: center;">
                    <i class="fas fa-heart" style="font-size: 24px; color: var(--primary); margin-bottom: 10px;"></i>
                    <h4 style="font-size: 14px; color: var(--gray); margin-bottom: 5px;">Esperanza de Vida</h4>
                    <p style="font-size: 18px; font-weight: 700; color: var(--dark);">${raza.esperanzaVida}</p>
                </div>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h3 style="font-size: 20px; font-weight: 700; color: var(--dark); margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-clipboard-list" style="color: var(--primary);"></i>
                    Cuidados Necesarios
                </h3>
                <p style="color: var(--gray); line-height: 1.8;">${raza.cuidados}</p>
            </div>
            
            <div>
                <h3 style="font-size: 20px; font-weight: 700; color: var(--dark); margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-notes-medical" style="color: var(--danger);"></i>
                    Enfermedades Comunes
                </h3>
                <ul style="list-style: none; padding: 0;">
                    ${raza.enfermedadesComunes.map(enfermedad => `
                        <li style="padding: 10px; background: var(--light-gray); border-radius: 8px; margin-bottom: 8px; color: var(--gray);">
                            <i class="fas fa-check-circle" style="color: var(--success); margin-right: 10px;"></i>
                            ${enfermedad}
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeBreedModal() {
    document.getElementById('breed-modal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('breed-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// ============================================
// PANEL ADMIN
// ============================================
async function checkAdminAccess() {
    if (currentUser && currentUser.email === ADMIN_EMAIL) {
        showLoading('Cargando panel administrativo...');
        hideAllSections();
        document.getElementById('admin-section').classList.add('active');
        await loadAdminData();
        hideLoading();
    } else {
        showToast('Acceso Denegado', 'No tienes permisos de administrador', 'error');
    }
}

document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        if (currentUser && currentUser.email === ADMIN_EMAIL) {
            checkAdminAccess();
        }
    }
});

async function loadAdminData() {
    try {
        const usersSnapshot = await db.collection('users').get();
        const totalUsers = usersSnapshot.size;
        
        const petsSnapshot = await db.collection('pets').get();
        const totalPets = petsSnapshot.size;
        
        const avgPets = totalUsers > 0 ? (totalPets / totalUsers).toFixed(1) : 0;
        
        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('total-pets').textContent = totalPets;
        document.getElementById('avg-pets').textContent = avgPets;
        
        const usersTableBody = document.getElementById('users-table-body');
        usersTableBody.innerHTML = '';
        
        const userPetCounts = {};
        petsSnapshot.forEach(doc => {
            const pet = doc.data();
            userPetCounts[pet.userId] = (userPetCounts[pet.userId] || 0) + 1;
        });
        
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            const petCount = userPetCounts[doc.id] || 0;
            const createdDate = user.createdAt ? user.createdAt.toDate().toLocaleDateString('es-ES') : 'N/A';
            
            const row = `
                <tr>
                    <td>${user.name || 'N/A'}</td>
                    <td>${user.email}</td>
                    <td>${createdDate}</td>
                    <td>${petCount}</td>
                </tr>
            `;
            usersTableBody.innerHTML += row;
        });
        
        const petsTableBody = document.getElementById('pets-table-body');
        petsTableBody.innerHTML = '';
        
        const userEmails = {};
        usersSnapshot.forEach(doc => {
            userEmails[doc.id] = doc.data().email;
        });
        
        petsSnapshot.forEach(doc => {
            const pet = doc.data();
            const ownerEmail = userEmails[pet.userId] || 'Desconocido';
            
            const row = `
                <tr>
                    <td>${pet.name}</td>
                    <td>${pet.breed}</td>
                    <td>${pet.weight} kg</td>
                    <td>${pet.age} años</td>
                    <td>${ownerEmail}</td>
                </tr>
            `;
            petsTableBody.innerHTML += row;
        });
        
    } catch (error) {
        console.error('Error cargando datos admin:', error);
        showToast('Error', 'No se pudieron cargar los datos', 'error');
    }
}

function exitAdmin() {
    showDashboard();
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type]}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// ============================================
// UTILIDADES
// ============================================
function scrollToFeatures() {
    document.getElementById('features-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
}