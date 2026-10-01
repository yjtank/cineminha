const TMDB_API_KEY = "edcd52275afd8b8c152c82f1ce39XXXX";

const moviesContainer = document.getElementById("popular-movies");
const featuredFilm = document.querySelector(".featured-film");

const featuredTitle = document.getElementById("featured-title");
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
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pt-BR`,
        );

        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        return response.json();
      }),
    );

    featuredIndicators.innerHTML = "";
    featuredMovies.forEach((movie, index) => {
      const indicator = document.createElement("button");
      indicator.className = "featured-film__indicator";
      indicator.type = "button";
      indicator.setAttribute("aria-label", `Exibir ${movie.title}`);
      indicator.addEventListener("click", () => showFeaturedMovie(index));
      featuredIndicators.appendChild(indicator);
    });

    showFeaturedMovie(0);
    featuredInterval = setInterval(() => {
      showFeaturedMovie((activeFeaturedIndex + 1) % featuredMovies.length);
    }, 7000);

  } catch (error) {
    console.error("Erro ao carregar destaque:", error);
    featuredTitle.textContent = "Não foi possível carregar o destaque";
    featuredDescription.textContent = "Tente novamente mais tarde.";
  }
}

function showFeaturedMovie(index) {
  const movie = featuredMovies[index];
  if (!movie) return;

  activeFeaturedIndex = index;
  featuredTitle.textContent = movie.title;
  featuredYear.textContent = movie.release_date.slice(0, 4);
  featuredGenre.textContent = movie.genres[0]?.name ?? "Gênero não informado";
  featuredRuntime.textContent = `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}min`;
  featuredRating.textContent = movie.vote_average.toFixed(1);
  featuredDescription.textContent = movie.overview;

  const backdrop = `url("https://image.tmdb.org/t/p/original${movie.backdrop_path}")`;
  featuredFilm.style.setProperty("--featured-backdrop", backdrop);
  featuredFilm.classList.remove("is-changing");
  void featuredFilm.offsetWidth;
  featuredFilm.classList.add("is-changing");

  [...featuredIndicators.children].forEach((indicator, indicatorIndex) => {
    indicator.classList.toggle("is-active", indicatorIndex === index);
    indicator.setAttribute("aria-current", indicatorIndex === index ? "true" : "false");
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

    moviesContainer.innerHTML = "";

    data.results.forEach((movie) => {
      const card = document.createElement("article");
      card.classList.add("film-card");

      const img = document.createElement("img");

      img.src = movie.poster_path
        ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
        : "./images/no-poster.png";

      img.alt = `Pôster de ${movie.title}`;

      const title = document.createElement("h4");
      title.textContent = movie.title;

      const meta = document.createElement("span");
      meta.classList.add("film-card__meta");

      const genre = document.createElement("span");
      genre.textContent = "Filme";

      const rating = document.createElement("b");
      rating.textContent = movie.vote_average.toFixed(1);

      meta.appendChild(genre);
      meta.appendChild(rating);

      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(meta);

      moviesContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Erro na requisição", error);
    moviesContainer.innerHTML = "<p>Não foi possível carregar os filmes.</p>";
  }
}

getPopularMovies();
getFeaturedMovies();