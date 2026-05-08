// slutprojekt.js - SeriesScore

const API_KEY = "DIN_TMDB_API_NYCKEL_HÄR";
const IMG_BASE = "https://image.tmdb.org/t/p/w342";

// =============================================
// SÖKSIDA (startsida.html)
// =============================================

async function sökSerie() {
    let searchInput = document.getElementById("searchInput");
    let resultsGrid = document.getElementById("resultsGrid");
    let resultsHeading = document.getElementById("resultsHeading");

    let query = searchInput.value.trim();
    if (!query) return;

    resultsGrid.innerHTML = "<p>Söker...</p>";

    try {
        let svar = await fetch(
            "https://api.themoviedb.org/3/search/tv?api_key=" + API_KEY + "&query=" + query + "&language=sv-SE"
        );
        if (!svar.ok) throw new Error("API-anropet misslyckades");
        let data = await svar.json();

        if (!data.results || data.results.length === 0) {
            resultsGrid.innerHTML = "<p>Inga serier hittades. Prova ett annat sökord!</p>";
            return;
        }

        resultsHeading.textContent = "Sökresultat";
        visaResultat(data.results);
    } catch (fel) {
        resultsGrid.innerHTML = "<p>Något gick fel. Kontrollera API-nyckeln och försök igen.</p>";
        console.error("Fel:", fel);
    }
}

function visaResultat(serier) {
    let resultsGrid = document.getElementById("resultsGrid");
    resultsGrid.innerHTML = "";

    serier.forEach(function(serie) {
        let bildUrl = serie.poster_path
            ? IMG_BASE + serie.poster_path
            : "images/no-poster.png";

        let betyg = serie.vote_average
            ? serie.vote_average.toFixed(1) + " / 10"
            : "Inget betyg";

        let kort = document.createElement("a");
        kort.className = "serie-card";
        kort.href = "detalj.html?id=" + serie.id;
        kort.innerHTML =
            '<img src="' + bildUrl + '" alt="Poster för ' + serie.name + '" loading="lazy">' +
            '<div class="card-info">' +
                '<div class="card-title">' + serie.name + '</div>' +
                '<div class="card-rating">' + betyg + '</div>' +
            '</div>';

        resultsGrid.appendChild(kort);
    });
}

// =============================================
// DETALJSIDA (detalj.html)
// =============================================

async function laddaDetaljer() {
    let params = new URLSearchParams(window.location.search);
    let serieId = params.get("id");
    let detailSection = document.getElementById("detailSection");

    if (!serieId) {
        detailSection.innerHTML = "<p>Inget serie-ID angavs. <a href='startsida.html'>Gå tillbaka</a></p>";
        return;
    }

    try {
        let svar = await fetch(
            "https://api.themoviedb.org/3/tv/" + serieId + "?api_key=" + API_KEY + "&language=sv-SE"
        );
        if (!svar.ok) throw new Error("Kunde inte hämta serieinfo");
        let serie = await svar.json();

        visaDetaljer(serie);
    } catch (fel) {
        document.getElementById("detailSection").innerHTML =
            "<p>Kunde inte ladda serieinfo. Försök igen senare. <a href='startsida.html'>Gå tillbaka</a></p>";
        console.error("Fel:", fel);
    }
}

function visaDetaljer(serie) {
    let detailSection = document.getElementById("detailSection");

    let bildUrl = serie.poster_path
        ? IMG_BASE + serie.poster_path
        : "images/no-poster.png";

    let genrer = "<span class='genre-tag'>Okänd genre</span>";
    if (serie.genres && serie.genres.length > 0) {
        genrer = "";
        serie.genres.forEach(function(g) {
            genrer += '<span class="genre-tag">' + g.name + '</span>';
        });
    }

    let betyg = serie.vote_average ? serie.vote_average.toFixed(1) : "N/A";
    let beskrivning = serie.overview ? serie.overview : "Ingen beskrivning tillgänglig.";

    // Bygg säsongstabell
    let tabellHTML = "";
    if (serie.seasons && serie.seasons.length > 0) {
        let totalEpisoder = 0;
        let rader = "";

        serie.seasons.forEach(function(s) {
            if (s.season_number > 0) {
                totalEpisoder += s.episode_count;
                rader += "<tr><td>" + s.name + "</td><td>" + s.episode_count + "</td></tr>";
            }
        });

        tabellHTML =
            '<table class="info-table">' +
                '<thead><tr><th>Säsong</th><th>Antal avsnitt</th></tr></thead>' +
                '<tbody>' + rader + '</tbody>' +
                '<tfoot><tr><td>Totalt</td><td>' + totalEpisoder + ' avsnitt</td></tr></tfoot>' +
            '</table>';
    }

    detailSection.innerHTML =
        '<div class="detail-top">' +
            '<img src="' + bildUrl + '" alt="Poster för ' + serie.name + '">' +
            '<div class="detail-info">' +
                '<h1>' + serie.name + '</h1>' +
                '<div>' + genrer + '</div>' +
                '<div class="score-total">Betyg: ' + betyg + ' / 10</div>' +
                '<p>' + beskrivning + '</p>' +
            '</div>' +
        '</div>' +
        tabellHTML;
}

// =============================================
// KONTAKTSIDA (kontakt.html)
// =============================================

function hanteraFormulär(e) {
    e.preventDefault();

    let namn       = document.getElementById("name").value.trim();
    let epost      = document.getElementById("email").value.trim();
    let arende     = document.getElementById("subject").value.trim();
    let meddelande = document.getElementById("message").value.trim();
    let formMsg    = document.getElementById("formMsg");

    if (!namn || !epost || !arende || !meddelande) {
        formMsg.textContent = "Fyll i alla fält innan du skickar.";
        formMsg.className = "form-msg error";
        return;
    }

    if (!epost.includes("@") || !epost.includes(".")) {
        formMsg.textContent = "Ange en giltig e-postadress.";
        formMsg.className = "form-msg error";
        return;
    }

    formMsg.textContent = "Tack! Ditt meddelande har skickats.";
    formMsg.className = "form-msg success";
    document.getElementById("contactForm").reset();
}

// =============================================
// Vänta tills sidan har laddats klart
// =============================================

window.onload = function() {

    // Söksida
    let searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
        searchBtn.addEventListener("click", sökSerie);
    }

    let searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.onkeydown = function(e) {
            if (e.key === "Enter") sökSerie();
        };
    }

    // Detaljsida
    let detailSection = document.getElementById("detailSection");
    if (detailSection) {
        laddaDetaljer();
    }

    // Kontaktformulär
    let contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", hanteraFormulär);
    }

};