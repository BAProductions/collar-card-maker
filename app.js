document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('cardForm');
  const cardContainer = document.getElementById('cardContainer');
  const fileInput = document.getElementById('localAvatar');
  const localAvatar = document.getElementById('avatar');

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        localAvatar.value = e.target.result;
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      localAvatar.value = '';
    }
  });

  function getRandomAvatarUrl() {
    const allowedNumbers = [
      63, 86, 71, 100, 81, 62, 78, 52, 74, 96, 61, 72, 64, 79, 66, 83, 87, 73, 92, 98,
      60, 89, 76, 67, 94, 85, 82, 88, 56, 53, 55, 68, 70, 90, 93, 51, 84, 59, 57, 75,
      77, 91, 54, 65, 80, 69, 95, 99, 97, 58
    ];
    const index = Math.floor(Math.random() * allowedNumbers.length);
    const number = allowedNumbers[index];
    return `https://avatar.iran.liara.run/public/${number}`;
  }

  function ampm(time24) {
    if (!time24) return renderMissingInfoMessage(conditions);;
    let [hour, minute] = time24.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; // convert 0 => 12
    return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }

  function renderMissingInfoMessage(conditions) {
    if ((conditions || '').toLowerCase() === 'virgin') {
      return `Owner knows`;
    } else {
      return `Available upon DM`;
    }
  }

  function formatOwnershipDate(rawDate) {
    if (!rawDate || rawDate.startsWith('0000') || rawDate.startsWith('0018')) {
      return 'Don’t ask me I forgot';
    }

    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return 'Don’t ask me I forgot'; // invalid date

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Populate form from localStorage if data exists
  const savedData = JSON.parse(localStorage.getItem('slaveFormData'));
  if (savedData) {
    Object.entries(savedData).forEach(([key, value]) => {
      const field = form.elements[key];
      if (!field) return;
      if (field.type === 'file') {
        if (key === 'avatar') {
          const preview = document.getElementById('avatarPreview');
          if (preview && value) {
            preview.src = URL.createObjectURL(value);
          }
        }
        return;
      }
      if (field.type === 'checkbox') {
        // If multiple checkboxes with same name, handle array
        if (Array.isArray(value)) {
          if (key === 'daysAvailable' && Array.isArray(value)) {
            value.forEach(day => {
            const checkbox = form.querySelector(`input[name="daysAvailable"][value="${day}"]`);
            if (checkbox) checkbox.setAttribute('checked', 'checked'); toggleDateInputs(checkbox.checked);

              // Restore start and end times for this day
              const startInput = form.querySelector(`input[name="availabilityDateStart${day}"]`);
              const endInput = form.querySelector(`input[name="availabilityDateEnd${day}"]`);

              if (savedData[`availabilityDateStart${day}`]) {
                startInput.value = savedData[`availabilityDateStart${day}`];
              }

              if (savedData[`availabilityDateEnd${day}`]) {
                endInput.value = savedData[`availabilityDateEnd${day}`];
              }
            });
          }
        } else {
          field.checked = !!value;
        }
      } else {
        field.value = value;
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    // Get selected days from checkboxes
    const daysAvailable = formData.getAll('daysAvailable');

    // Build schedule array for selected days
    const schedule = daysAvailable.map(day => ({
      day,
      start: formData.get(`availabilityDateStart${day}`) || '',
      end: formData.get(`availabilityDateEnd${day}`) || '',
    }));

    const avatarFile = formData.get('localAvatar');
    const avatarURI = formData.get('avatar');
    let avatarUrl = getRandomAvatarUrl();

    if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
      avatarUrl = URL.createObjectURL(avatarFile);
    } else {
      avatarUrl = avatarURI;
    }

    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Holiday'];

    // schedule is array of checked days with start/end
    // Create a map for quick lookup
    const scheduleMap = {};
    schedule.forEach(({ day, start, end }) => {
      scheduleMap[day] = { start, end };
    });

    const anyDayChecked = schedule.length > 0;
    const conditions = formData.get('conditions') || '';

    const scheduleHTML = allDays.map(day => {
      if (anyDayChecked) {
        if (scheduleMap[day] && scheduleMap[day].start && scheduleMap[day].end) {
          return `<li><span class="info-label">${day}:</span> ${ampm(scheduleMap[day].start)} - ${ampm(scheduleMap[day].end)}</li>`;
        } else {
          return `<li><span class="info-label">${day}:</span> Unavailable</li>`;
        }
      } else {
        return `<li><span class="info-label">${day}:</span>${renderMissingInfoMessage(conditions)}</li>`;
      }
    }).join('');

    // Build the card HTML
    const cardHTML = `
      <article class="slave-card" tabindex="0" aria-label="Slave Card for ${formData.get('name') || 'Unknown'}">
        <div class="server-info">
            <img src="logo.png" alt="Build A Fem Slave ID Logo" class="logo" />
            <h2 class="name">Build A Fem Slave ID</h2>
        </div>
        <div class="header">
          <img src="${avatarUrl}" alt="Avatar of ${formData.get('name') || 'Unknown'}" class="avatar" />
          <div class="user-info">
            <h2 class="name">${formData.get('name') || 'Unnamed'}</h2>
            <p class="bio">${formData.get('bio') || ''}</p>
          </div>
        </div>
        <section class="card-section">
          <h3>Info</h3>
          <ul class="info-list">
            <li><span class="info-label">Owner:</span> DJABHipHop</li>
            <li><span class="info-label">Ownership Date:</span> ${formData.get('ownershipDate') || renderMissingInfoMessage(conditions)}</li>
            <li><span class="info-label">Experience Level:</span> ${formData.get('experience') || renderMissingInfoMessage(conditions)}</li>
            <li><span class="info-label">Gender:</span> ${formData.get('gender') || renderMissingInfoMessage(conditions)}</li>
            <li><span class="info-label">Trans Status:</span> ${formData.get('transStatus') || renderMissingInfoMessage(conditions)}</li>
            <li><span class="info-label">Timezone:</span> ${formData.get('timezone') || renderMissingInfoMessage(conditions)}</li>
            <li><span class="info-label">Availability:</span> ${formData.get('availability') || renderMissingInfoMessage(conditions)}</li>
            <li><span class="info-label">Conditions:</span> ${formData.get('conditions') || renderMissingInfoMessage(conditions)}</li>
            <li><span class="info-label">Kinks:</span> ${formData.get('kinks') || renderMissingInfoMessage(conditions)}</li>
            <li><span class="info-label">No No’s:</span> ${formData.get('noNos') || renderMissingInfoMessage(conditions)}</li>
          </ul>
        </section>
        <section class="card-section">
          <h3>Toys, Clothes, etc</h3>
          <p>${formData.get('items') || 'No Clothing Yet'}</p>
        </section>
        <section class="card-section">
          <h3>Schedule</h3>
          <ul class="info-list">
            ${scheduleHTML}
          </ul>
        </section>
      </article>
    `;

    // Save form data to localStorage
    const obj = {};
    form.querySelectorAll('input, textarea, select').forEach(input => {
      if (input.type === 'checkbox') {
        if (!obj[input.name]) obj[input.name] = [];
        if (input.checked) obj[input.name].push(input.value);
      } else {
        if(input.value) {
          obj[input.name] = input.value;
        } else {
          obj[input.name] = '';
        }
      }
    });
    localStorage.setItem('slaveFormData', JSON.stringify(obj));

    const cardElement = cardContainer.querySelector('.slave-card');
    const cardImage = cardContainer.querySelector('.card-image');
    const downloadLink = cardContainer.querySelector('.download-link');

    try {
      const cardDOM = document.createElement('div');
      cardDOM.innerHTML = cardHTML;
      document.body.appendChild(cardDOM); // Optional: only if you need styles applied
      const canvas = await html2canvas(cardDOM, { backgroundColor: "#000000" });
      document.body.removeChild(cardDOM); // Clean up afterward
      const imgDataUrl = canvas.toDataURL('image/png');

      cardImage.src = imgDataUrl;

      downloadLink.href = imgDataUrl;
      downloadLink.classList.remove('disabled');
      const name = formData.get('name')?.toString().trim();
      downloadLink.download = `${name || 'slave'}-slave-card.png`;

    } catch (error) {
      console.error('Error generating card image:', error);
    }
  });
});
