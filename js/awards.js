async function loadAwards() {
    try {
        const response = await fetch('/api/awards');
        const awards = await response.json();

        const container = document.getElementById('awardsContainer');

        container.innerHTML = "";

        awards.forEach(award => {

            container.innerHTML += `
                <div class="award-card">

                    <img src="${award.image}" alt="${award.title}">

                    <div class="award-info">

                        <div class="award-year">
                            🏆 ${award.year}
                        </div>

                        <h2 class="award-title">
                            ${award.title}
                        </h2>

                        <p class="award-description">
                            ${award.description}
                        </p>

                    </div>

                </div>
            `;

        });

    } catch (error) {
        console.error("Failed to load awards:", error);
    }
}

loadAwards();