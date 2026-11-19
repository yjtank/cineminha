const moviesContainer = document.getElementById("popular-movies");
const topRatedContainer = document.getElementById("top-rated-movies");
const seriesContainer = document.getElementById("popular-series");

const featuredFilm = document.querySelector(".featured-film");

const featuredLogo = document.getElementById("featured-logo");
const featuredYear = document.getElementById("featured-year");
const featuredGenre = document.getElementById("featured-genre");
const featuredRuntime = document.getElementById("featured-runtime");
const featuredRating = document.getElementById("featured-rating");
const featuredDescription = document.getElementById("featured-description");
const featuredIndicators = document.querySelector(".featured-film__indicators");

const featuredMovieIds = [693134, 872585, 438631, 533535];

let featuredMovies = [];
let activeFeaturedIndex = 0;
let featuredInterval;

async function getFeaturedMovies() {
  try {
    featuredMovies = await Promise.all(
      featuredMovieIds.map(async (movieId) => {
        const [movieResponse, imagesResponse] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pt-BR`,
          ),
          fetch(
            `https://api.themoviedb.org/3/movie/${movieId}/images?api_key=${TMDB_API_KEY}`,
          ),
        ]);

        if (!movieResponse.ok || !imagesResponse.ok) {
          throw new Error("Erro ao carregar filme ou imagens");
        }

        const movie = await movieResponse.json();
        const images = await imagesResponse.json();

        const logos = images.logos || [];

        const logo =
          logos.find((item) => item.iso_639_1 === "pt") ||
          logos.find((item) => item.iso_639_1 === "en") ||
          logos.find((item) => item.iso_639_1 === null) ||
          logos[0];

        movie.clearLogo = logo?.file_path || null;

        return movie;
      }),
    );

    featuredIndicators.innerHTML = "";

    featuredMovies.forEach((movie, index) => {
      const indicator = document.createElement("button");
      indicator.className = "featured-film__indicator";
      indicator.type = "button";
      indicator.setAttribute("aria-label", `Exibir ${movie.title}`);
      indicator.addEventListener("click", () => {
        showFeaturedMovie(index);
        restartFeaturedInterval();
      });

      featuredIndicators.appendChild(indicator);
    });

    showFeaturedMovie(0);

    restartFeaturedInterval();
  } catch (error) {
    console.error("Erro ao carregar destaque:", error);
    if (featuredLogo) {
      featuredLogo.style.display = "none";
    }

    featuredDescription.textContent =
      "Não foi possível carregar o destaque. Tente novamente mais tarde.";
  }
}

function restartFeaturedInterval() {
  clearInterval(featuredInterval);
  featuredInterval = setInterval(() => {
    showFeaturedMovie((activeFeaturedIndex + 1) % featuredMovies.length);
  }, 7000);
}

function showFeaturedMovie(index) {
  const movie = featuredMovies[index];
  if (!movie) return;

  activeFeaturedIndex = index;

  if (movie.clearLogo) {
    featuredLogo.src = `https://image.tmdb.org/t/p/w500${movie.clearLogo}`;

    featuredLogo.alt = `Logo de ${movie.title}`;
    featuredLogo.style.display = "block";
  } else {
    featuredLogo.style.display = "none";
  }
  featuredYear.textContent = movie.release_date?.slice(0, 4) ?? "";
  featuredGenre.textContent = movie.genres[0]?.name ?? "Gênero não informado";
  featuredRuntime.textContent = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}min`
    : "";
  featuredRating.textContent = movie.vote_average.toFixed(1);
  featuredDescription.textContent = movie.overview;

  const watchButton = document.getElementById("featured-watch");
  watchButton.href = `movie-details.html?id=${movie.id}&type=movie`;

  const backdrop = `url("https://image.tmdb.org/t/p/original${movie.backdrop_path}")`;

  featuredFilm.style.setProperty("--featured-backdrop", backdrop);
  featuredFilm.classList.remove("is-changing");

  void featuredFilm.offsetWidth;

  featuredFilm.classList.add("is-changing");

  [...featuredIndicators.children].forEach((indicator, indicatorIndex) => {
    indicator.classList.toggle("is-active", indicatorIndex === index);

    indicator.setAttribute(
      "aria-current",
      indicatorIndex === index ? "true" : "false",
    );
  });
}

function renderMovies(container, movies, type = "Filme") {
  container.innerHTML = "";

  movies.forEach((movie) => {
    const card = document.createElement("article");
    card.classList.add("film-card");

    // Abrir página de detalhes
    card.addEventListener("click", () => {
      if (type === "Série") {
        window.location.href = `serie-details.html?id=${movie.id}&type=tv`;
      } else {
        window.location.href = `movie-details.html?id=${movie.id}&type=movie`;
      }
    });

    const img = document.createElement("img");

    img.src = movie.poster_path
      ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
      : "./assets/images/img1.png";

    img.alt = `Pôster de ${movie.title || movie.name}`;

    const title = document.createElement("h4");
    title.textContent = movie.title || movie.name;

    const meta = document.createElement("span");
    meta.classList.add("film-card__meta");

    const genre = document.createElement("span");
    genre.textContent = type;

    const rating = document.createElement("b");
    rating.textContent = Number(movie.vote_average || 0).toFixed(1);

    meta.appendChild(genre);
    meta.appendChild(rating);

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(meta);

    container.appendChild(card);
  });
}

async function getPopularMovies() {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR`,
    );

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    renderMovies(moviesContainer, data.results);
  } catch (error) {
    console.error("Erro ao carregar filmes em alta:", error);

    moviesContainer.innerHTML = "<p>Não foi possível carregar os filmes.</p>";
  }
}

async function getTopRatedMovies() {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=pt-BR`,
    );

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    renderMovies(topRatedContainer, data.results);
  } catch (error) {
    console.error("Erro ao carregar filmes:", error);

    topRatedContainer.innerHTML = "<p>Não foi possível carregar os filmes.</p>";
  }
}

async function getPopularSeries() {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR`,
    );

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    renderMovies(seriesContainer, data.results, "Série");
  } catch (error) {
    console.error("Erro ao carregar séries:", error);

    seriesContainer.innerHTML = "<p>Não foi possível carregar as séries.</p>";
  }
}

getPopularMovies();
getTopRatedMovies();
getPopularSeries();
getFeaturedMovies();
