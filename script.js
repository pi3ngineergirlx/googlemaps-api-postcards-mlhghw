let map;
let markers = [];
let infoWindow;
let AdvancedMarkerElement;
const errorContainer = document.getElementById('error-container');
const gallery = document.getElementById('gallery');
const heading = document.getElementById('heading');
const summary = document.getElementById('summary');

function displayError(message, error) {
  console.error(message, error);
  let userMessage = message;

  const errorMessage = error ? error.toString() : '';
  if (errorMessage.includes('BillingNotEnabledMapError') || errorMessage.includes('ApiNotActivatedMapError')) {
    userMessage = 'Error: Billing is not enabled for your project. Please go to the Google Cloud Console, select your project, and ensure it is linked to a valid billing account.';
  } else if (errorMessage.includes('InvalidKeyMapError')) {
    userMessage = 'Error: The API key you provided is invalid. Please double-check the key in your HTML file.';
  } else if (errorMessage.includes('RefererNotAllowedMapError')) {
    userMessage = 'Error: Your API key has HTTP referrer restrictions that are blocking the request. For local testing, you can remove these restrictions. For production, add your website\'s domain to the allowed list in the Google Cloud Console.';
  }

  heading.textContent = '';
  summary.textContent = '';
  errorContainer.textContent = `${userMessage} Check the browser's developer console for more details.`;
  errorContainer.classList.remove('hidden');
}

async function initMap() {
  try {
    const { Map, ControlPosition, InfoWindow } = await google.maps.importLibrary("maps");
    await google.maps.importLibrary("places");
    ({ AdvancedMarkerElement } = await google.maps.importLibrary("marker"));

    map = new Map(document.getElementById('map'), {
      center: { lat: 48.8566, lng: 2.3522 },
      zoom: 12,
      mapId: 'DEMO_MAP_ID',
      mapTypeControl: false,
      streetViewControl: false,
    });

    infoWindow = new InfoWindow();

    const toggleContentBtn = document.createElement('button');
    toggleContentBtn.innerHTML = '<span class="material-icons">visibility</span>';
    toggleContentBtn.classList.add('map-control-button');
    toggleContentBtn.title = 'Hide content panel';

    if (ControlPosition && ControlPosition.TOP_RIGHT) {
        map.controls[ControlPosition.TOP_RIGHT].push(toggleContentBtn);
    } else {
        console.error('ControlPosition.TOP_RIGHT is undefined. Ensure the Google Maps library is loaded correctly.');
    }

    const container = document.getElementById('container');
    toggleContentBtn.addEventListener('click', () => {
      container.classList.toggle('content-hidden');
      const icon = toggleContentBtn.querySelector('.material-icons');
      if (container.classList.contains('content-hidden')) {
        icon.textContent = 'visibility_off';
        toggleContentBtn.title = 'Show content panel';
      } else {
        icon.textContent = 'visibility';
        toggleContentBtn.title = 'Hide content panel';
      }
      google.maps.event.trigger(map, 'resize');
    });

    const placeAutocomplete = document.getElementById('place-autocomplete');
    placeAutocomplete.addEventListener('gmp-select', async (event) => {
        const place = event.place;
        if (!place) return;

        clearMarkers();
        gallery.innerHTML = '';
        heading.textContent = 'Loading...';
        summary.textContent = '';
        errorContainer.classList.add('hidden');

        try {
            await place.fetchFields({ fields: ['displayName', 'photos', 'editorialSummary', 'location'] });

            heading.textContent = place.displayName;
            summary.textContent = place.editorialSummary?.text || '';

            if (place.location) {
                map.setCenter(place.location);
                map.setZoom(12);
                addMarker(place);
            }

            if (place.photos && place.photos.length > 0) {
                place.photos.forEach(photo => {
                    const img = document.createElement('img');
                    img.src = photo.getURI({ maxHeight: 400, maxWidth: 400 });
                    img.dataset.fullSrc = photo.getURI();
                    img.dataset.attribution = photo.authorAttributions?.displayName || 'Google User';
                    img.addEventListener('click', openModal);
                    gallery.appendChild(img);
                });
            } else {
                gallery.innerHTML = '<p>No photos found for this location.</p>';
            }
        } catch (error) {
            displayError(`Failed to fetch details for "${place.displayName || 'the selected location'}".`, error);
        }
    });

    await searchForPlace('Paris, France');

    const modal = document.getElementById('modal');
    const span = document.getElementsByClassName('close');
    span.onclick = function() {
      modal.style.display = "none";
    }
  } catch (error) {
    displayError('The Google Maps JavaScript API could not load.', error);
  }
}

async function searchForPlace(query) {
  clearMarkers();
  gallery.innerHTML = '';
  heading.textContent = 'Loading...';
  summary.textContent = '';
  errorContainer.classList.add('hidden');

  if (!query || query.trim() === '') {
    heading.textContent = '';
    displayError('Please enter a location to search.');
    return;
  }

  try {
    const { Place } = await google.maps.importLibrary("places");
    const request = {
      textQuery: query,
      fields: ['displayName', 'photos', 'editorialSummary', 'location'],
    };

    const { places } = await Place.searchByText(request);

    if (places.length > 0) {
      const place = places[0];

      heading.textContent = place.displayName;
      summary.textContent = place.editorialSummary?.text || '';

      if (place.location) {
          map.setCenter(place.location);
          map.setZoom(12);
          addMarker(place);
      }

      if (place.photos && place.photos.length > 0) {
        place.photos.forEach(photo => {
          const img = document.createElement('img');
          img.src = photo.getURI({ maxHeight: 400, maxWidth: 400 });
          img.dataset.fullSrc = photo.getURI();
          img.dataset.attribution = photo.authorAttributions?.displayName || 'Google User';
          img.addEventListener('click', openModal);
          gallery.appendChild(img);
        });
      } else {
        gallery.innerHTML = '<p>No photos found for this location.</p>';
      }
    } else {
      displayError(`No places found for "${query}".`);
    }
  } catch (error) {
    displayError(`The Places search request failed for "${query}".`, error);
  }
}

function addMarker(place) {
    const marker = new AdvancedMarkerElement({
        map,
        position: place.location,
        title: place.displayName,
    });

    marker.addListener('click', () => {
        infoWindow.setContent(place.displayName);
        infoWindow.open(map, marker);
    });

    markers.push(marker);
}

function clearMarkers() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].map = null;
    }
    markers = [];
}

function openModal(event) {
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-image');
  const captionText = document.getElementById('caption');

  modal.style.display = "block";
  modalImg.src = event.target.dataset.fullSrc;
  captionText.innerHTML = `Photo by: ${event.target.dataset.attribution}`;
}

initMap();