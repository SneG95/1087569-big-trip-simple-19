import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import { formatDateForm, findOffers, getDestinationId, findDestination } from '../utils.js';
import flatpickr from 'flatpickr';
import { TYPES_POINT } from '../consts.js';

import 'flatpickr/dist/flatpickr.min.css';

const BLANK_FORM = {
  basePrice: 1500,
  dateFrom: new Date(),
  dateTo: new Date(),
  destination: 1,
  offers: [],
  type: TYPES_POINT[0]
};

const createEventListTemplate = (type, types) => (
  `<div class="event__type-list">
    <fieldset class="event__type-group">
      <legend class="visually-hidden">Event type</legend>
      ${types.map((name) =>
    `<div class="event__type-item">
        <input id="event-type-${name}-1" class="event__type-input  visually-hidden" type="radio" name="event-type" value="${name}" ${type === name ? 'checked' : ''}>
        <label class="event__type-label  event__type-label--${name}" for="event-type-${name}-1">${name}</label>
      </div>`).join('')}
    </fieldset>
  </div>`
);

const createOffersTemplate = (offers, checkedOffers, isDisabled) => {
  if (offers.length > 0) {
    return (
      `<section class="event__section  event__section--offers">
        <h3 class="event__section-title  event__section-title--offers">Offers</h3>
        <div class="event__available-offers">${offers.map(({ id, title, price }) =>`
          <div class="event__offer-selector">
            <input class="event__offer-checkbox  visually-hidden" id="event-offer-${id}" type="checkbox" name="event-offer-${id}" value=${id} ${checkedOffers.includes(id) ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
              <label class="event__offer-label" for="event-offer-${id}">
                <span class="event__offer-title">${title}</span>
                  &plus;&euro;&nbsp;
                <span class="event__offer-price">${price}</span>
              </label>
          </div>`).join('')}
        </div>
      </section>`);
  } else {
    return '';
  }
};

const createPhotosTemplate = (photos) => (
  `<div class="event__photos-container">
    <div class="event__photos-tape">
        ${photos.map(({src, description}) => `<img class="event__photo" src="${src}" alt="${description}">`).join('')}
    </div>
   </div>`
);

const createDestinationTemplate = (destination) => {
  const photos = destination.pictures;
  const description = destination.description;
  const photosTemplate = createPhotosTemplate(photos);
  if (photos.length > 0 && description !== null) {
    return (
      `<section class="event__section  event__section--destination">
        <h3 class="event__section-title  event__section-title--destination">Destination</h3>
        <p class="event__destination-description">${description}</p>

        ${photosTemplate}

      </section>`);
  } else {
    return '';
  }
};

const createEditFormTemplate = (point, showButton) => {
  const {
    basePrice,
    dateFrom,
    dateTo,
    offers,
    type,
    destination,
    destinations,
    cities,
    allOffersByType,
    isDisabled,
    isSaving,
    isDeleting} = point;
  const destinationOfPoint = findDestination(destination, destinations);
  const offersTemplate = createOffersTemplate(allOffersByType, offers, isDisabled);
  const eventListTemplate = createEventListTemplate(type, TYPES_POINT);
  const destinationTemplate = createDestinationTemplate(destinationOfPoint);

  return (
    `<li class="trip-events__item">
        <form class="event event--edit" action="#" method="post">
          <header class="event__header">
            <div class="event__type-wrapper">
              <label class="event__type  event__type-btn" for="event-type-toggle-1">
                <span class="visually-hidden">Choose event type</span>
                <img class="event__type-icon" width="17" height="17" src="img/icons/${type}.png" alt="Event type icon">
              </label>
              <input class="event__type-toggle  visually-hidden" id="event-type-toggle-1" type="checkbox" ${isDisabled ? 'disabled' : ''}>

              ${eventListTemplate}

            </div>

            <div class="event__field-group  event__field-group--destination">
              <label class="event__label  event__type-output" for="event-destination-1">
                ${type}
              </label>
              <input class="event__input  event__input--destination" id="event-destination-1" type="text" name="event-destination" value="${destinationOfPoint.name}" list="destination-list-1" ${isDisabled ? 'disabled' : ''} autocomplete="off">
              <datalist id="destination-list-1">
                ${cities.map((city) => `<option value="${city}"></option>`).join('')}
              </datalist>
            </div>

            <div class="event__field-group  event__field-group--time">
              <label class="visually-hidden" for="event-start-time-1">From</label>
              <input class="event__input  event__input--time" id="event-start-time-1" type="text" name="event-start-time" value="${formatDateForm(dateFrom)}" ${isDisabled ? 'disabled' : ''}>
              &mdash;
              <label class="visually-hidden" for="event-end-time-1">To</label>
              <input class="event__input  event__input--time" id="event-end-time-1" type="text" name="event-end-time" value="${formatDateForm(dateTo)}" ${isDisabled ? 'disabled' : ''}>
            </div>

            <div class="event__field-group  event__field-group--price">
              <label class="event__label" for="event-price-1">
                <span class="visually-hidden">Price</span>
                &euro;
              </label>
              <input class="event__input  event__input--price" id="event-price-1" type="number" min="0" name="event-price" value="${basePrice}" required ${isDisabled ? 'disabled' : ''}>
            </div>

            <button class="event__save-btn  btn  btn--blue" type="submit" ${isDisabled ? 'disabled' : ''}>${isSaving ? 'Saving...' : 'Save'}</button>
            <button class="event__reset-btn" type="reset" ${isDisabled ? 'disabled' : ''}>${isDeleting ? 'Deleting...' : 'Delete'}</button>
            <button class="event__rollup-btn" type="button" ${showButton ? '' : 'style="display: none;"'}">
              <span class="visually-hidden">Open event</span>
            </button>
          </header>
          <section class="event__details">

            ${offersTemplate}
            ${destinationTemplate}

          </section>
        </form>
    </li>`
  );
};

export default class EditFormView extends AbstractStatefulView {
  #handleFormSubmit = null;
  #handleButtonClick = null;
  #showButton = null;
  #datePickerFrom = null;
  #datePickerTo = null;
  #handleDeleteClick = null;
  #cities = [];
  #offersByType = [];
  #destinations = [];

  constructor({point = BLANK_FORM, destinations, cities, offersByType, onFormSubmit, onFormButtonClick, onDeleteClick}, showButton) {
    super();
    this.#showButton = showButton;
    this.#cities = cities;
    this.#destinations = destinations;
    this.#offersByType = offersByType;
    this._setState(EditFormView.parsePointToState(point, destinations, cities, offersByType));
    this.#handleFormSubmit = onFormSubmit;
    this.#handleButtonClick = onFormButtonClick;
    this.#handleDeleteClick = onDeleteClick;

    this._restoreHandlers();
  }

  get template() {
    return createEditFormTemplate(this._state, this.#showButton);
  }

  _restoreHandlers() {
    this.element.querySelector('form')
      .addEventListener('submit', this.#formSubmitHandler);
    this.element.querySelector('.event__rollup-btn')
      .addEventListener('click', this.#formButtonClickHandler);
    this.element.querySelector('.event__type-group')
      .addEventListener('change', this.#eventTypeChangeHandler);
    this.element.querySelector('.event__field-group--destination')
      .addEventListener('change', this.#eventDestinationChangeHandler);
    this.#setDatePicker();
    this.element.querySelector('.event__reset-btn')
      .addEventListener('click', this.#formDeleteClickHandler);
    this.element.querySelector('.event__input--price')
      .addEventListener('change', this.#changePriceHandler);
  }

  removeElement() {
    super.removeElement();

    if (this.#datePickerFrom) {
      this.#datePickerFrom.destroy();
      this.#datePickerFrom = null;
    }

    if (this.#datePickerTo) {
      this.#datePickerTo.destroy();
      this.#datePickerTo = null;
    }
  }

  reset(point) {
    this.updateElement(
      EditFormView.parsePointToState(point, this.#destinations, this.#cities, this.#offersByType)
    );
  }

  #setDatePicker() {
    this.#datePickerFrom = flatpickr(
      this.element.querySelector('#event-start-time-1'),
      {
        dateFormat: 'j/n/y H:i',
        defaultDate: this._state.dateFrom,
        maxDate: this._state.dateTo,
        onClose: this.#dateFromChangeHandler,
        enableTime: true,
        // eslint-disable-next-line camelcase
        time_24hr: true,
        minuteIncrement: 1
      }
    );
    this.#datePickerTo = flatpickr(
      this.element.querySelector('#event-end-time-1'),
      {
        dateFormat: 'j/n/y H:i',
        defaultDate: this._state.dateTo,
        minDate: this._state.dateFrom,
        onClose: this.#dateToChangeHandler,
        enableTime: true,
        // eslint-disable-next-line camelcase
        time_24hr: true,
        minuteIncrement: 1
      }
    );
  }

  #formSubmitHandler = (evt) => {
    evt.preventDefault();
    if (this._state.allOffersByType.length > 0) {
      const checkedOffers = [...this.element.querySelectorAll('.event__offer-checkbox:checked')].map((item) => +item.value);
      this.updateElement({
        offers: checkedOffers
      });
    }
    this.#handleFormSubmit(EditFormView.parseStateToPoint(this._state));
  };

  #formButtonClickHandler = (evt) => {
    evt.preventDefault();
    this.#handleButtonClick();
  };

  #formDeleteClickHandler = (evt) => {
    evt.preventDefault();
    this.#handleDeleteClick(EditFormView.parseStateToPoint(this._state));
  };

  #eventTypeChangeHandler = (evt) => {
    evt.preventDefault();
    this.updateElement({
      type: evt.target.value,
      allOffersByType: findOffers(evt.target.value, this.#offersByType)
    });
  };

  #eventDestinationChangeHandler = (evt) => {
    evt.preventDefault();
    if (!this.#cities.includes(evt.target.value)) {
      evt.target.setCustomValidity('Введите значение из предложенных');
    } else {
      evt.target.setCustomValidity('');
      this.updateElement({
        destination: getDestinationId(evt.target.value, this.#destinations)
      });
    }
    evt.target.reportValidity();
  };

  #dateFromChangeHandler = ([userDateFrom]) => {
    this.updateElement({
      dateFrom: userDateFrom
    });
  };

  #dateToChangeHandler = ([userDateTo]) => {
    this.updateElement({
      dateTo: userDateTo
    });
  };

  #changePriceHandler = (evt) => {
    this._state.basePrice = +evt.target.value;
  };

  static parsePointToState(point, destinations, cities, offersByType) {
    return {...point,
      destinations: destinations,
      cities: cities,
      allOffersByType: findOffers(point.type, offersByType),
      isDisabled: false,
      isSaving: false,
      isDeleting: false
    };
  }

  static parseStateToPoint(state) {
    const point = {...state};

    delete point.allOffersByType;
    delete point.destinations;
    delete point.cities;
    delete point.isDisabled;
    delete point.isSaving;
    delete point.isDeleting;

    return point;
  }
}
