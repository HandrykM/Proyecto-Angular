// ========== CONFIGURACIÓN Y DATOS ==========

const WATER_TYPES = {
    basico: [
        {
            id: 1,
            name: 'Agua de Lluvia',
            description: 'Agua recogida de las canaletas',
            icon: 'fas fa-cloud-rain',
            correct: 'reutilizable',
            explanation: 'El agua de lluvia es limpia naturalmente y perfecta para riego, inodoros y limpieza.'
        },
        {
            id: 2,
            name: 'Agua del Inodoro',
            description: 'Agua con heces y microorganismos',
            icon: 'fas fa-toilet',
            correct: 'no-reutilizable',
            explanation: 'Altamente contaminada con patógenos peligrosos. NO se puede reutilizar sin tratamiento industrial.'
        },
        {
            id: 3,
            name: 'Agua de Enjuague de Verduras',
            description: 'Agua usada para limpiar frutas',
            icon: 'fas fa-carrot',
            correct: 'reutilizable',
            explanation: 'Contiene nutrientes beneficiosos para plantas. Perfecta para riego directo.'
        },
        {
            id: 4,
            name: 'Agua de Ropa (con Jabón)',
            description: 'Agua de lavadora con detergente',
            icon: 'fas fa-shirt',
            correct: 'tratamiento',
            explanation: 'Se puede usar en WC o limpieza externa después de ser filtrada.'
        },
        {
            id: 5,
            name: 'Agua de Enjuagar Arroz',
            description: 'Agua con almidón del arroz',
            icon: 'fas fa-bowl-rice',
            correct: 'reutilizable',
            explanation: 'Rica en nutrientes para plantas. Excelente para riego.'
        },
        {
            id: 6,
            name: 'Agua del Aire Acondicionado',
            description: 'Agua de condensación del A/C',
            icon: 'fas fa-fan',
            correct: 'reutilizable',
            explanation: 'Limpia y desionizada. Perfecta para riego y limpieza.'
        },
        {
            id: 7,
            name: 'Agua del Fregadero (con Grasa)',
            description: 'Agua con restos de comida',
            icon: 'fas fa-sink',
            correct: 'tratamiento',
            explanation: 'Requiere filtración para separar la grasa. Luego se puede usar para limpiar.'
        },
        {
            id: 8,
            name: 'Agua del Lavamanos',
            description: 'Agua de manos y cara',
            icon: 'fas fa-hands-washing',
            correct: 'tratamiento',
            explanation: 'Se puede tratar levemente para usar en inodoros o riego.'
        }
    ],
    intermedio: [
        {
            id: 1,
            name: 'Agua de Lluvia',
            description: 'Agua recogida de las canaletas',
            icon: 'fas fa-cloud-rain',
            correct: 'reutilizable',
            explanation: 'El agua de lluvia es limpia naturalmente y perfecta para riego, inodoros y limpieza.'
        },
        {
            id: 2,
            name: 'Agua del Inodoro',
            description: 'Agua con heces y microorganismos',
            icon: 'fas fa-toilet',
            correct: 'no-reutilizable',
            explanation: 'Altamente contaminada con patógenos peligrosos. NO se puede reutilizar sin tratamiento industrial.'
        },
        {
            id: 3,
            name: 'Agua de Enjuague de Verduras',
            description: 'Agua usada para limpiar frutas',
            icon: 'fas fa-carrot',
            correct: 'reutilizable',
            explanation: 'Contiene nutrientes beneficiosos para plantas. Perfecta para riego directo.'
        },
        {
            id: 4,
            name: 'Agua de Ropa (con Jabón)',
            description: 'Agua de lavadora con detergente',
            icon: 'fas fa-shirt',
            correct: 'tratamiento',
            explanation: 'Se puede usar en WC o limpieza externa después de ser filtrada.'
        },
        {
            id: 9,
            name: 'Agua de la Ducha',
            description: 'Agua de baño después del precalentamiento',
            icon: 'fas fa-shower',
            correct: 'tratamiento',
            explanation: 'Se puede almacenar temporalmente para riego o descarga de inodoros.'
        },
        {
            id: 10,
            name: 'Agua de Hervir Vegetales',
            description: 'Agua de cocción con nutrientes',
            icon: 'fas fa-pot-food',
            correct: 'reutilizable',
            explanation: 'Sin sal añadida, es excelente para plantas. Esperar a que se enfríe.'
        },
        {
            id: 7,
            name: 'Agua del Fregadero (con Grasa)',
            description: 'Agua con restos de comida',
            icon: 'fas fa-sink',
            correct: 'tratamiento',
            explanation: 'Requiere filtración para separar la grasa. Luego se puede usar para limpiar.'
        },
        {
            id: 8,
            name: 'Agua del Lavamanos',
            description: 'Agua de manos y cara',
            icon: 'fas fa-hands-washing',
            correct: 'tratamiento',
            explanation: 'Se puede tratar levemente para usar en inodoros o riego.'
        },
        {
            id: 5,
            name: 'Agua de Enjuagar Arroz',
            description: 'Agua con almidón del arroz',
            icon: 'fas fa-bowl-rice',
            correct: 'reutilizable',
            explanation: 'Rica en nutrientes para plantas. Excelente para riego.'
        },
        {
            id: 6,
            name: 'Agua del Aire Acondicionado',
            description: 'Agua de condensación del A/C',
            icon: 'fas fa-fan',
            correct: 'reutilizable',
            explanation: 'Limpia y desionizada. Perfecta para riego y limpieza.'
        }
    ],
    avanzado: [
        {
            id: 1,
            name: 'Agua de Lluvia',
            description: 'Agua recogida de las canaletas',
            icon: 'fas fa-cloud-rain',
            correct: 'reutilizable',
            explanation: 'El agua de lluvia es limpia naturalmente y perfecta para riego, inodoros y limpieza.'
        },
        {
            id: 2,
            name: 'Agua del Inodoro',
            description: 'Agua con heces y microorganismos',
            icon: 'fas fa-toilet',
            correct: 'no-reutilizable',
            explanation: 'Altamente contaminada con patógenos peligrosos. NO se puede reutilizar sin tratamiento industrial.'
        },
        {
            id: 3,
            name: 'Agua de Enjuague de Verduras',
            description: 'Agua usada para limpiar frutas',
            icon: 'fas fa-carrot',
            correct: 'reutilizable',
            explanation: 'Contiene nutrientes beneficiosos para plantas. Perfecta para riego directo.'
        },
        {
            id: 4,
            name: 'Agua de Ropa (con Jabón)',
            description: 'Agua de lavadora con detergente',
            icon: 'fas fa-shirt',
            correct: 'tratamiento',
            explanation: 'Se puede usar en WC o limpieza externa después de ser filtrada.'
        },
        {
            id: 5,
            name: 'Agua de Enjuagar Arroz',
            description: 'Agua con almidón del arroz',
            icon: 'fas fa-bowl-rice',
            correct: 'reutilizable',
            explanation: 'Rica en nutrientes para plantas. Excelente para riego.'
        },
        {
            id: 6,
            name: 'Agua del Aire Acondicionado',
            description: 'Agua de condensación del A/C',
            icon: 'fas fa-fan',
            correct: 'reutilizable',
            explanation: 'Limpia y desionizada. Perfecta para riego y limpieza.'
        },
        {
            id: 7,
            name: 'Agua del Fregadero (con Grasa)',
            description: 'Agua con restos de comida',
            icon: 'fas fa-sink',
            correct: 'tratamiento',
            explanation: 'Requiere filtración para separar la grasa. Luego se puede usar para limpiar.'
        },
        {
            id: 8,
            name: 'Agua del Lavamanos',
            description: 'Agua de manos y cara',
            icon: 'fas fa-hands-washing',
            correct: 'tratamiento',
            explanation: 'Se puede tratar levemente para usar en inodoros o riego.'
        },
        {
            id: 9,
            name: 'Agua de la Ducha',
            description: 'Agua de baño después del precalentamiento',
            icon: 'fas fa-shower',
            correct: 'tratamiento',
            explanation: 'Se puede almacenar temporalmente para riego o descarga de inodoros.'
        },
        {
            id: 10,
            name: 'Agua de Hervir Vegetales',
            description: 'Agua de cocción con nutrientes',
            icon: 'fas fa-pot-food',
            correct: 'reutilizable',
            explanation: 'Sin sal añadida, es excelente para plantas. Esperar a que se enfríe.'
        },
        {
            id: 11,
            name: 'Agua de Piscina con Cloro',
            description: 'Agua con químicos de desinfección',
            icon: 'fas fa-water',
            correct: 'no-reutilizable',
            explanation: 'El cloro daña plantas y microorganismos del suelo. Requiere purificación completa.'
        },
        {
            id: 12,
            name: 'Agua de Drenaje Séptico',
            description: 'Agua de sistema séptico',
            icon: 'fas fa-pipe',
            correct: 'no-reutilizable',
            explanation: 'Extremadamente contaminada. NO debe reutilizarse sin tratamiento profesional.'
        }
    ]
};

// ========== ESTADO DEL JUEGO ==========

let gameState = {
    difficulty: 'basico',
    currentCardIndex: 0,
    score: 0,
    correctAnswers: 0,
    totalCards: 0,
    timeLeft: 60,
    startTime: Date.now(),
    selectedCategory: null,
    cards: [],
    results: [],
    gameStarted: false,
    gamePaused: false,
    timerInterval: null,
    draggedCard: null,
    originalPosition: null
};

// ========== ELEMENTOS DEL DOM ==========

const screens = {
    welcome: document.getElementById('welcome-screen'),
    instructions: document.getElementById('instructions-screen'),
    difficulty: document.getElementById('difficulty-screen'),
    game: document.getElementById('game-screen'),
    feedback: document.getElementById('feedback-screen'),
    results: document.getElementById('results-screen')
};

const buttons = {
    start: document.getElementById('start-btn'),
    instructions: document.getElementById('instructions-btn'),
    beginGame: document.getElementById('begin-game-btn'),
    skip: document.getElementById('skip-btn'),
    submit: document.getElementById('submit-btn'),
    next: document.getElementById('next-btn'),
    replay: document.getElementById('replay-btn'),
    home: document.getElementById('home-btn')
};

const displays = {
    currentCard: document.getElementById('current-card'),
    totalCards: document.getElementById('total-cards'),
    timer: document.getElementById('timer'),
    score: document.getElementById('score'),
    cardName: document.getElementById('card-name'),
    cardDescription: document.getElementById('card-description'),
    feedbackTitle: document.getElementById('feedback-title'),
    feedbackExplanation: document.getElementById('feedback-explanation'),
    feedbackIcon: document.getElementById('feedback-icon')
};

// ========== INICIALIZACIÓN ==========

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    getURLParams();
});

function setupEventListeners() {
    buttons.start.addEventListener('click', showInstructionsScreen);
    buttons.instructions.addEventListener('click', showInstructionsScreen);
    buttons.beginGame.addEventListener('click', showDifficultyScreen);
    
    document.querySelectorAll('.difficulty-card').forEach(card => {
        card.addEventListener('click', (e) => {
            gameState.difficulty = e.currentTarget.dataset.difficulty;
            startGame();
        });
    });

    buttons.skip.addEventListener('click', skipCard);
    buttons.submit.addEventListener('click', submitAnswer);
    buttons.next.addEventListener('click', nextCard);
    buttons.replay.addEventListener('click', resetGame);
    buttons.home.addEventListener('click', () => {
        sendGameCompleted(
            Math.round((gameState.correctAnswers / gameState.totalCards) * 100),
            Math.floor((Date.now() - gameState.startTime) / 1000)
        );
    });

    // Zonas de drop
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('drop', handleDrop);
        zone.addEventListener('dragleave', handleDragLeave);
    });

    // Hacer la tarjeta arrastrable
    const waterCard = document.getElementById('water-card');
    if (waterCard) {
        waterCard.addEventListener('dragstart', handleDragStart);
        waterCard.addEventListener('dragend', handleDragEnd);
    }
}

function getURLParams() {
    const params = new URLSearchParams(window.location.search);
    gameState.difficulty = params.get('nivel') || 'basico';
}

// ========== PANTALLAS ==========

function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.remove('active');
    });
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
    }
}

function showInstructionsScreen() {
    showScreen('instructions');
}

function showDifficultyScreen() {
    showScreen('difficulty');
}

function startGame() {
    gameState.gameStarted = true;
    gameState.cards = [...WATER_TYPES[gameState.difficulty]];
    gameState.totalCards = gameState.cards.length;
    gameState.currentCardIndex = 0;
    gameState.score = 0;
    gameState.correctAnswers = 0;
    gameState.startTime = Date.now();
    gameState.timeLeft = 60;

    displays.totalCards.textContent = gameState.totalCards;
    
    showScreen('game');
    displayCard();
    startTimer();
    sendGameUpdate();
}

// ========== JUEGO PRINCIPAL ==========

function displayCard() {
    if (gameState.currentCardIndex >= gameState.totalCards) {
        endGame();
        return;
    }

    const card = gameState.cards[gameState.currentCardIndex];
    displays.currentCard.textContent = gameState.currentCardIndex + 1;
    displays.cardName.textContent = card.name;
    displays.cardDescription.textContent = card.description;

    const iconElement = document.querySelector('.card-icon i');
    if (iconElement) {
        iconElement.className = card.icon;
    }

    gameState.selectedCategory = null;
    buttons.submit.disabled = true;

    // Limpiar zonas de drop
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.innerHTML = '<p class="drop-hint">Arrastra aquí</p>';
        zone.classList.remove('filled', 'hover');
    });

    sendGameUpdate();
}

let draggedElement = null;
let dragGhost = null;

function handleDragStart(e) {
    const waterCard = document.getElementById('water-card');
    if (e.currentTarget !== waterCard) return;

    draggedElement = e.currentTarget;
    gameState.draggedCard = gameState.cards[gameState.currentCardIndex];
    
    // Crear una imagen fantasma para el arrastre
    dragGhost = draggedElement.cloneNode(true);
    dragGhost.style.position = 'absolute';
    dragGhost.style.top = '-1000px';
    dragGhost.style.opacity = '0.7';
    dragGhost.style.transform = 'scale(0.8)';
    dragGhost.style.pointerEvents = 'none';
    document.body.appendChild(dragGhost);
    
    e.dataTransfer.setDragImage(dragGhost, 0, 0);
    e.dataTransfer.effectAllowed = 'move';
    
    // Hacer la tarjeta más pequeña visualmente
    draggedElement.style.opacity = '0.5';
    draggedElement.style.transform = 'scale(0.95)';
    draggedElement.classList.add('dragging');
}

function handleDragEnd(e) {
    // Restaurar la tarjeta original
    if (draggedElement) {
        draggedElement.style.opacity = '1';
        draggedElement.style.transform = 'scale(1)';
        draggedElement.classList.remove('dragging');
    }
    
    // Limpiar imagen fantasma
    if (dragGhost && dragGhost.parentNode) {
        dragGhost.parentNode.removeChild(dragGhost);
    }
    
    draggedElement = null;
    dragGhost = null;
    
    // Limpiar todas las zonas de drop
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.classList.remove('hover');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('hover');
    e.dataTransfer.dropEffect = 'move';
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('hover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('hover');

    if (!draggedElement || draggedElement.id !== 'water-card') {
        return;
    }

    const category = e.currentTarget.closest('.category-zone').dataset.category;
    
    // Verificar si ya hay una tarjeta en otra zona
    const otherFilledZones = document.querySelectorAll('.drop-zone.filled');
    
    // Si ya hay una tarjeta colocada en otra zona, limpiarla
    otherFilledZones.forEach(zone => {
        if (zone !== e.currentTarget) {
            zone.innerHTML = '<p class="drop-hint">Arrastra aquí</p>';
            zone.classList.remove('filled');
        }
    });
    
    // Colocar la tarjeta en la nueva zona
    gameState.selectedCategory = category;
    buttons.submit.disabled = false;

    const card = gameState.cards[gameState.currentCardIndex];
    e.currentTarget.innerHTML = `
        <div class="selected-card">
            <i class="${card.icon}"></i>
            <p>${card.name}</p>
        </div>
    `;
    e.currentTarget.classList.add('filled');
}

function submitAnswer() {
    if (!gameState.selectedCategory) return;

    const card = gameState.cards[gameState.currentCardIndex];
    const isCorrect = gameState.selectedCategory === card.correct;

    gameState.results.push({
        card: card.name,
        selected: gameState.selectedCategory,
        correct: card.correct,
        isCorrect: isCorrect
    });

    if (isCorrect) {
        gameState.correctAnswers++;
        gameState.score += 100;
        displayFeedback('correct', card.explanation);
    } else {
        gameState.score = Math.max(0, gameState.score - 25);
        displayFeedback('incorrect', `Respuesta correcta: ${getCategoryName(card.correct)}. ${card.explanation}`);
    }

    buttons.submit.disabled = true;
    displays.score.textContent = gameState.score;
    sendGameUpdate();
}

function displayFeedback(type, explanation) {
    const icon = displays.feedbackIcon;
    const title = displays.feedbackTitle;
    const exp = displays.feedbackExplanation;

    const feedbackContent = document.querySelector('.feedback-content');

    if (type === 'correct') {
        icon.innerHTML = '<i class="fas fa-check-circle"></i>';
        icon.className = 'feedback-icon correct';
        title.textContent = '¡Correcto!';
        title.style.color = '#2ecc71';
        if (feedbackContent) feedbackContent.classList.remove('incorrect');
        if (feedbackContent) feedbackContent.classList.add('correct');
    } else {
        icon.innerHTML = '<i class="fas fa-times-circle"></i>';
        icon.className = 'feedback-icon incorrect';
        title.textContent = 'Incorrecto';
        title.style.color = '#e74c3c';
        if (feedbackContent) feedbackContent.classList.remove('correct');
        if (feedbackContent) feedbackContent.classList.add('incorrect');
    }

    exp.textContent = explanation;
    showScreen('feedback');
}

function skipCard() {
    gameState.results.push({
        card: gameState.cards[gameState.currentCardIndex].name,
        selected: null,
        correct: gameState.cards[gameState.currentCardIndex].correct,
        isCorrect: false
    });
    nextCard();
}

function nextCard() {
    gameState.currentCardIndex++;
    if (gameState.currentCardIndex < gameState.totalCards) {
        showScreen('game');
        displayCard();
    } else {
        endGame();
    }
}

// ========== TEMPORIZADOR ==========

function startTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }

    gameState.timeLeft = 60;
    displays.timer.textContent = gameState.timeLeft;
    displays.timer.style.color = 'white';

    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        displays.timer.textContent = gameState.timeLeft;

        if (gameState.timeLeft <= 10) {
            displays.timer.style.color = '#e74c3c';
        }

        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            endGame();
        }
    }, 1000);
}

// ========== FIN DEL JUEGO ==========

function endGame() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    gameState.gamePaused = true;

    const accuracy = gameState.totalCards > 0 ? 
        Math.round((gameState.correctAnswers / gameState.totalCards) * 100) : 0;
    const timeTaken = Math.floor((Date.now() - gameState.startTime) / 1000);

    displayResults(accuracy, timeTaken);
    sendGameCompleted(accuracy, timeTaken);
}

function displayResults(accuracy, timeTaken) {
    const medal = accuracy >= 85 ? 'gold' : accuracy >= 70 ? 'silver' : 'bronze';
    const medalIcon = document.getElementById('medal');
    if (medalIcon) {
        medalIcon.className = `medal ${medal}`;
    }

    const finalCorrect = document.getElementById('final-correct');
    const finalAccuracy = document.getElementById('final-accuracy');
    const finalScore = document.getElementById('final-score');
    const finalTime = document.getElementById('final-time');

    if (finalCorrect) finalCorrect.textContent = gameState.correctAnswers;
    if (finalAccuracy) finalAccuracy.textContent = accuracy;
    if (finalScore) finalScore.textContent = gameState.score;
    if (finalTime) finalTime.textContent = formatTime(timeTaken);

    // Generar resumen
    const summaryContent = document.getElementById('summary-content');
    if (summaryContent) {
        let html = '';

        gameState.results.forEach((result) => {
            const icon = result.isCorrect ? 
                '<i class="fas fa-check" style="color: #2ecc71;"></i>' : 
                '<i class="fas fa-times" style="color: #e74c3c;"></i>';
            
            html += `
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; padding: 0.5rem; background: ${result.isCorrect ? '#f0fdf4' : '#fef2f2'}; border-radius: 8px;">
                    ${icon}
                    <span>${result.card}</span>
                </div>
            `;
        });

        summaryContent.innerHTML = html;
    }

    showScreen('results');
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

function resetGame() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    gameState = {
        difficulty: gameState.difficulty,
        currentCardIndex: 0,
        score: 0,
        correctAnswers: 0,
        totalCards: 0,
        timeLeft: 60,
        startTime: Date.now(),
        selectedCategory: null,
        cards: [],
        results: [],
        gameStarted: false,
        gamePaused: false,
        timerInterval: null
    };
    showScreen('welcome');
}

// ========== COMUNICACIÓN CON PARENT ==========

function sendGameUpdate() {
    const accuracy = gameState.totalCards > 0 ? 
        Math.round((gameState.correctAnswers / gameState.totalCards) * 100) : 0;

    window.parent.postMessage({
        type: 'juego-update',
        correctas: gameState.correctAnswers,
        total: gameState.totalCards,
        puntuacion: gameState.score,
        precision: accuracy,
        tiempoTranscurrido: Math.floor((Date.now() - gameState.startTime) / 1000)
    }, '*');
}

function sendGameCompleted(accuracy, timeTaken) {
    window.parent.postMessage({
        type: 'juego-completed',
        correctas: gameState.correctAnswers,
        total: gameState.totalCards,
        puntuacion: gameState.score,
        precision: accuracy,
        tiempo: timeTaken,
        nivel: gameState.difficulty,
        medalleta: accuracy >= 85 ? 'oro' : accuracy >= 70 ? 'plata' : 'bronce'
    }, '*');
}

// ========== UTILIDADES ==========

function getCategoryName(category) {
    const names = {
        'reutilizable': 'Reutilizable Directamente',
        'tratamiento': 'Reutilizable con Tratamiento',
        'no-reutilizable': 'No Reutilizable'
    };
    return names[category] || category;
}