/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
import './styles.css';
import timeMarkup from './templates/timeMarkup.hbs';
import daysTitleMarkup from './templates/daysTitleMarkup.hbs';
import fromOption from './templates/formOption.hbs';
import calendarEvents from './templates/calendarEvents.hbs';

const Times = [
  '10-00',
  '11-00',
  '12-00',
  '13-00',
  '14-00',
  '15-00',
  '16-00',
  '17-00',
  '18-00',
];
const Days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
let eventIdToDelete;

const refs = {
  timeContainer: document.querySelector('.time-container'),
  dayTitleContainer: document.querySelector('.day-container'),
  formDayOption: document.querySelector('#formDay'),
  formTimeOption: document.querySelector('#formTime'),
  newEventButton: document.querySelector('.new-event'),
  closeModal: document.querySelector('button[data-action="close-modal"]'),
  jsBackdrop: document.querySelector('.js-backdrop'),
  cancelBtn: document.querySelector('.cancel-btn'),
  form: document.querySelector('form'),
  errorMessage: document.querySelector('.error-message'),
  filterId: document.querySelector('#filter'),
  closeModalEventDel: document.querySelector('#closeModalEventDel'),
  confirmationEventDel: document.querySelector('#confirmationEventDel'),
};
// слушатели собитый
refs.form.addEventListener('submit', handleSubmitWithFormData);
refs.newEventButton.addEventListener('click', handleOpenModal);
refs.closeModalEventDel.addEventListener('click', handleCloseModalEventDel);
refs.closeModal.addEventListener('click', handleCloseModal);
refs.cancelBtn.addEventListener('click', handleCloseModal);
refs.jsBackdrop.addEventListener('click', handleBackdropClick);
refs.filterId.addEventListener('click', showFilteredEvents);
refs.confirmationEventDel.addEventListener('click', confirmationEventDel);

const renderMarkup = (mapData, hbsMarkup, htmlSelector) => {
  const markup = mapData.map((el) => hbsMarkup(el)).join('');
  htmlSelector.insertAdjacentHTML('beforeend', markup);
};

const renderParticipants = () => {
  const storage = readLocalStorage();
  if (!storage) {
    return;
  }
  const participants = [];

  storage.forEach((elStorage) => {
    let arryOfNameparticipants = elStorage.participants.split(',');
    arryOfNameparticipants = arryOfNameparticipants.map((el) => el.toLowerCase().trim());
    if (arryOfNameparticipants.length === 1) {
      if (!participants.includes(arryOfNameparticipants[0])) {
        participants.push(arryOfNameparticipants[0]);
      }
    } else {
      arryOfNameparticipants.forEach((el) => {
        if (!participants.includes(el)) {
          participants.push(el);
        }
      });
    }
  });
  renderMarkup(participants, fromOption, refs.filterId);
};
const renderTimesMarkup = (time) => {
  renderMarkup(time, timeMarkup, refs.timeContainer);
};

const renderDaysTitleMarkup = (days) => {
  renderMarkup(days, daysTitleMarkup, refs.dayTitleContainer);
};

const renderFormOption = (days, times) => {
  renderMarkup(days, fromOption, refs.formDayOption);
  renderMarkup(times, fromOption, refs.formTimeOption);
};

const createCalendarEvents = (dayOfWeek, timeOfDay) => {
  // заполнить календарь полями
  // for (let elDay of dayOfWeek) {
  dayOfWeek.forEach((elDay) => {
    let selectorName = elDay;
    selectorName = document.querySelector(`.${selectorName}`);

    const markup = timeOfDay
      .map((time) => calendarEvents({ elDay, time }))
      .join('');
    selectorName.insertAdjacentHTML('beforeend', markup);
  });
};
const renderCalendarEvents = (filterParticipant) => {
  const storage = readLocalStorage();
  if (!storage) {
    return;
  }

  storage.forEach((el) => {
    // очистить все поля
    clearEventsCalendar(el.day, el.time, '');

    if (filterParticipant === 'all members') {
      renderFilteredEvents(el.day, el.time, el.eventName);
    }

    if (el.participants.toLowerCase().includes(filterParticipant)) {
      renderFilteredEvents(el.day, el.time, el.eventName);
    }
  });
};

renderTimesMarkup(Times);
renderDaysTitleMarkup(Days);
renderFormOption(Days, Times);
renderParticipants();
createCalendarEvents(Days, Times);
renderCalendarEvents('all members');

function renderFilteredEvents(day, time, eventName) {
  const selector = document.getElementById(`${day}${time}`);
  selector.innerText = `${eventName}`;
  const button = document.createElement('button');
  button.classList.add('del-btn');
  const tagI = document.createElement('i');
  tagI.classList.add('material-icons');
  tagI.innerText = 'close';
  selector.appendChild(button);
  button.appendChild(tagI);

  selector.addEventListener('click', handleOpenModalDelEvent);
}

function clearEventsCalendar(day, time) {
  const selector = document.getElementById(`${day}${time}`);
  selector.innerText = '';
}

function showFilteredEvents(event) {
  if (!event) {
    return;
  }

  const filter = event.target.value.toLowerCase();

  if (filter === 'all members') {
    renderCalendarEvents('all members');
  }

  renderCalendarEvents(filter);
}

/// форма
function handleSubmitWithFormData(event) {
  const formData = new FormData(event.currentTarget);
  const data = {};
  formData.forEach((value, name) => {
    data[name] = value.trim();
  });

  const storage = readLocalStorage();
  if (storage) {
    const filteredStorageByDay = storage.filter((el) => el.day === data.day);

    const isTimeOfDateFree = filteredStorageByDay.some(
      (el) => el.time === data.time,
    );

    if (!isTimeOfDateFree) {
      setLocalStorage([...storage, data]);
    } else {
      showformErrorMessage('choose anather time');
      event.preventDefault();
    }
  } else {
    setLocalStorage([data]);
  }
}

function showformErrorMessage(text) {
  refs.errorMessage.innerText = text;
}
// локальное хранилище

function setLocalStorage(newStorage) {
  localStorage.setItem('events', JSON.stringify(newStorage));
}
function readLocalStorage() {
  const savedSettings = localStorage.getItem('events');
  const parsedSettings = JSON.parse(savedSettings);

  return parsedSettings;
}

// управление модальными окнами
// удаление события
function handleOpenModalDelEvent(e) {
  e.preventDefault();
  eventIdToDelete = e.currentTarget.id;
  const overlay = document.querySelector('.overlay-del-event');
  overlay.classList.add('is-visible');
  window.addEventListener('keydown', handleKeyPress);
}
function confirmationEventDel(e) {
  handleDeleteEvent(e, eventIdToDelete);
}
function handleDeleteEvent(e, eventIdToDel) {
  const storage = readLocalStorage();
  if (!storage) {
    return;
  }

  const currentIdEl = eventIdToDel;
  const day = currentIdEl.slice(0, 3);
  const time = currentIdEl.slice(3);

  const newStorage = [];
  //  поиск из локала и удаление
  storage.forEach((el) => {
    if (el.day === day && el.time === time) {
      return;
    } else {
      newStorage.push(el);
    }
  });

  setLocalStorage(newStorage);
  location.reload();
  handleCloseModalEventDel();
}

function handleCloseModalEventDel() {
  const overlay = document.querySelector('.overlay-del-event');
  overlay.classList.remove('is-visible');
  window.removeEventListener('keydown', handleKeyPress);
}

// закрытие формы создать событие
function handleOpenModal(e) {
  e.preventDefault();
  const overlay = document.querySelector('.overlay-form');
  overlay.classList.add('is-visible');
  window.addEventListener('keydown', handleKeyPress);
}
function handleCloseModal() {
  const overlay = document.querySelector('.overlay-form');
  overlay.classList.remove('is-visible');
  window.removeEventListener('keydown', handleKeyPress);
}
function handleBackdropClick(event) {
  if (event.target !== event.currentTarget) {
    return;
  }

  handleCloseModal();
}
function handleKeyPress(event) {
  if (event.code !== 'Escape') {
    return;
  }
  handleCloseModal();
}
