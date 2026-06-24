async function loadAwards() {
  try {
    const response = await fetch('/api/awards');
    const awards = await response.json();

    const container = document.getElementById('awardsContainer');

    awards.forEach(award => {
      container.innerHTML += `
        <div class="service-card">
          <h3>${award.year} — ${award.title}</h3>
          <p>${award.description}</p>
        </div>
      `;
    });

  } catch (error) {
    console.error('Failed to load awards:', error);
  }
}

loadAwards();