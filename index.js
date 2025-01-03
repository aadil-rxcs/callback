deploymentURL = 'https://script.google.com/macros/s/AKfycbzcZ9mxGJEIyPHVcNLjq2BzfTF2A9OsOiju0HIYsUj2a1Ue2NkPZiqxtVJR1LuGffCS/exec'

$(document).ready(function() {
    $('#datepicker').datepicker({
        dateFormat: 'dd/mm/yy',
        minDate: 0,
        beforeShowDay: function(date) {
            var day = date.getDay();
            if (day == 0 || day == 6) {
                return [false];
            } else {
                return [true];
            }
        }
    });
});

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
    }

function linkBroken() {
    document.getElementById('errorMessage').style.display = 'block';
    document.getElementById('assistanceForm').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    }

const id = getUrlParameter('id');
const s = getUrlParameter('s');
const status = getUrlParameter('status');

document.getElementById('assistanceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const dateInput = document.getElementById('datepicker').value;
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    
    if (!regex.test(dateInput)) {
        alert('Please use the given calendar to pick a valid date.');
        return;
    }

    const [day, month, year] = dateInput.split('/').map(Number);
    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (inputDate <= today) {
        alert('Please select a date in the future.');
        return;
    }
    const weekday = inputDate.getDay();
    if (weekday === 0 || weekday === 6) {
        alert('Please select a weekday (Monday to Friday) for the date.');
        e.preventDefault();
        return;
    }

    console.log("Input Date:", inputDate);
    const formattedUpdateDate = `${String(inputDate.getDate()).padStart(2, '0')}-${String(inputDate.getMonth() + 1).padStart(2, '0')}-${inputDate.getFullYear()}`;
    console.log("Form submitted with date:", formattedUpdateDate);

    const time = document.getElementById('time').value;
    // console.log("Form submitted with date:", inputDate, "and time:", time);
    handleFormSubmission(id, "Interested", formattedUpdateDate, time);
});


async function fetchPatientData(id) {
    // console.log("Fetching patient data for ID:", id);
    const get_url = `${deploymentURL}?method=get&id=${id}`;
    try {
        document.getElementById('loading').style.display = 'flex';
        const response = await fetch(get_url);
        const data = await response.json();
        // console.log(data);
        document.getElementById('patientName').value = data["Patient Name"];
        document.getElementById('id').value = data["TBT ID"];

        if (data["Date"] && data["Time"]){
            if (data["Date"] != "NA") {
                const dateInput = new Date(data["Date"]);
                
                const formattedDate = [
                    String(dateInput.getDate()).padStart(2, '0'),
                    String(dateInput.getMonth() + 1).padStart(2, '0'),
                    dateInput.getFullYear()
                ].join('/');
                
                document.getElementById('datepicker').value = formattedDate;
            }
            
            if (data["Time"] != "NA") {
                const timeInput = new Date(data["Time"]);
                const localHours = timeInput.getHours();
                const localMinutes = String(timeInput.getMinutes()).padStart(2, '0');
                const ampm = localHours >= 12 ? 'PM' : 'AM';
                const formattedHours = localHours % 12 || 12;        
                const formattedTime = `${formattedHours}:${localMinutes} ${ampm}`;
                
                // console.log("Formatted Date:", formattedDate);
                // console.log("Formatted Time:", formattedTime);
                
                const timeDropdown = document.getElementById('time');
                const optionToSelect = Array.from(timeDropdown.options).find(
                    (option) => option.value === formattedTime
                );    
                
                if (optionToSelect) {
                    optionToSelect.selected = true;
                } 
                // else {
                    //     console.warn('No matching time found in the dropdown for:', formattedTime);
                    // }
            }
        }

        document.getElementById('assistanceForm').style.display = 'block';
    } catch (error) {
        // console.error('Error fetching data:', error);
        linkBroken();
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

async function handleFormSubmission(id, status, date, time) {
    // console.log("Writing for: ", id);
    const post_url = `${deploymentURL}?method=post&id=${id}&status=${status}&date=${date}&time=${time}`;
    try {
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('assistanceForm').style.display = 'none';
        document.getElementById('loadingSpinnerInfo').innerText = 'Submitting response...';
        
        const response = await fetch(post_url);
        const data = await response.json();
        // console.log(data);
        
        document.getElementById('thankYouMessage').style.display = 'block';
        document.getElementById('errorMessage').style.display = 'none';
    } catch (error) {
        // console.error('Error posting data:', error);
        document.getElementById('errorMessage').style.display = 'block';
        document.getElementById('assistanceForm').style.display = 'block';
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

if ((!id || !status) && (!id || !s))  {
    console.error('Invalid URL parameters.');
    linkBroken();
} else {
    if (status === 'Interested' || s === 'y') {
        fetchPatientData(id); 
    } 
    else if (status === 'NotInterested' || s === 'n') {
        handleFormSubmission(id, "Not Interested", "NA", "NA");
    } else {
        linkBroken();
    }
}