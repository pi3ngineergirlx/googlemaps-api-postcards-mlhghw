let map;
let markers = [];
let infoWindow;
let AdvancedMarkerElement;
const errorContainer = document.getElementById('error_container');
const gallery = document.getElementById('picture-gallery');
const heading = document.getElementById('heading');
const summary = document.getElementById('summary');

function displayError(message, error){ 
console.error(message, error); 
let user_message = message

const error_message = error ? error.toString() : ''; 


if (error_message.includes('BillingNotEnabledMapError') || error_message.includes('ApiNotActivatedMapError')){
    user_message = 'Error: Billing is not Enabled on your Google API account. Please go to the Google Cloud Console, select your project, and ensure it is linked to a valid billing account.'
} else if (error_message.includes('InvalidKeyMapError')){
    user_message = 'Error: You entered an Invalud API Key. Please double check your key in the code.'
} else if (error_message.includes('RefererNotAllowedMapError')){
    user_message = 'Error: Your API key has HTTP referrer restrictions that are blocking the request. For local testing, you can remove these restrictions. For production, add your website\'s domain to the allowed list in the Google Cloud Console.'
}

heading.textContent = '';
summary.textContent = '';

error_container.textContent = `${user_message}. Check the browser's dev console for more context on the existing error preventing the successful run of your page.`
error_container.classList.remove('hidden'); 
}
