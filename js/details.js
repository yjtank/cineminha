
const params = new URLSearchParams(window.location.search);

const id = params.get("id");
const type = params.get("type") || "movie";

const imageBase = "https://image.tmdb.org/t/p/";

async function loadDetails() {
  if (!id || !["movie", "tv"].includes(type)) {
    showError("Conteúdo não encontrado");
    return;
  }

  try {
    const [detailsResponse, extraResponse, imagesResponse] = await Promise.all([
      fetch(
        `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`,
      ),
      fetch(
        `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=videos,credits,recommendations`,
      ),
      fetch(
        `https://api.themoviedb.org/3/${type}/${id}/images?api_key=${TMDB_API_KEY}&include_image_language=pt-BR,en,null`,
      ),
    ]);

    if (!detailsResponse.ok || !extraResponse.ok || !imagesResponse.ok) {
      throw new Error("Não foi possível carregar os detalhes.");
    }

    const data = await detailsResponse.json();
    const extra = await extraResponse.json();
    const images = await imagesResponse.json();

    const title = data.title || data.name;
    const originalTitle = data.original_title || data.original_name;
    const releaseDate = data.release_date || data.first_air_date;

    document.title = `${title} | CINEMINHA`;

    document.getElementById("detail-title").textContent = title;

    document.getElementById("detail-original").textContent =
      originalTitle !== title ? originalTitle : "";

    renderClearLogo(images.logos || [], title);

    document.getElementById("detail-poster").src =
      data.poster_path
        ? `${imageBase}w500${data.poster_path}`
        : "./assets/images/img1.png";

    document.getElementById("movie-hero").style.backgroundImage =
      data.backdrop_path
        ? `url("${imageBase}original${data.backdrop_path}")`
        : "none";
    document.getElementById("movie-hero").style.backgroundSize = "cover";
    document.getElementById("movie-hero").style.backgroundPosition = "center";

    document.getElementById("detail-year").textContent =
      releaseDate ? releaseDate.slice(0, 4) : "Ano indisponível";

    document.getElementById("detail-rating").textContent =
      `★ ${Number(data.vote_average || 0).toFixed(1)}`;

    document.getElementById("detail-runtime").textContent =
      type === "movie"
        ? data.runtime
          ? `${data.runtime} min`
          : "Duração indisponível"
        : `${data.number_of_seasons || 0} temporadas`;

    const genresContainer = document.getElementById("detail-genres");

    genresContainer.innerHTML = "";

    (data.genres || []).forEach((genre) => {
      const span = document.createElement("span");
      span.textContent = genre.name;
      genresContainer.appendChild(span);
    });

    document.getElementById("detail-overview").textContent =
      data.overview || "Sinopse não disponível.";

    document.getElementById("detail-status").textContent =
      data.status || "-";

    document.getElementById("detail-language").textContent =
      (data.original_language || "-").toUpperCase();

    document.querySelector(".movie-extra__item:last-child span").textContent =
      type === "movie" ? "Orçamento" : "Temporadas";

    document.getElementById("detail-budget").textContent =
      type === "movie"
        ? data.budget
          ? new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "USD"
            }).format(data.budget)
          : "Não informado"
        : data.number_of_seasons || "-";

    renderTrailer(extra.videos?.results || []);
    renderDirector(extra.credits?.crew || [], data.created_by || []);
    renderCast(extra.credits?.cast || []);
    renderSimilar(extra.recommendations?.results || []);
    if (type === "tv") {
      renderSeasons(data.seasons || []);
    }
  } catch (error) {
    console.error(error);
    showError(
      "Não foi possível carregar as informações.",
      "Tente novamente.",
    );
  }
}

function showError(title, overview = "") {
  document.getElementById("detail-title").textContent = title;
  document.getElementById("detail-overview").textContent =
    overview || "Não foi possível carregar as informações.";
}

function renderClearLogo(logos, title) {
  const logo =
    logos.find((item) => item.iso_639_1 === "pt") ||
    logos.find((item) => item.iso_639_1 === "en") ||
    logos.find((item) => item.iso_639_1 === null) ||
    logos[0];

  const container = document.getElementById("detail-logo");
  const image = document.getElementById("detail-logo-image");

  if (logo) {
    image.src = `${imageBase}w500${logo.file_path}`;
    image.alt = `Logo de ${title}`;
    container.style.display = "flex";
    document.getElementById("detail-title").style.display = "none";
  } else {
    image.removeAttribute("src");
    container.style.display = "none";
    document.getElementById("detail-title").style.display = "block";
  }
}

function renderTrailer(videos) {
  const trailerButton = document.getElementById("trailer-button");
  const trailer =
    videos.find(
      (video) =>
        video.site === "YouTube" &&
        video.type === "Trailer" &&
        video.official,
    ) ||
    videos.find(
      (video) =>
        video.site === "YouTube" &&
        (video.type === "Trailer" || video.type === "Teaser"),
    );

  if (trailer) {
    trailerButton.href = `https://www.youtube.com/watch?v=${trailer.key}`;
    trailerButton.setAttribute("rel", "noopener");
  } else {
    trailerButton.removeAttribute("href");
    trailerButton.setAttribute("aria-disabled", "true");
    trailerButton.textContent = "Trailer indisponível";
  }
}

function renderDirector(crew, creators) {
  const director = crew.find((person) => person.job === "Director");
  const creatorNames = creators.map((person) => person.name).filter(Boolean);

  document.querySelector(".movie-extra__item:first-child span").textContent =
    type === "movie" ? "Direção" : "Criação";
  document.getElementById("detail-director").textContent =
    director?.name || creatorNames.join(", ") || "-";
}

function renderCast(cast) {
  const container = document.getElementById("movie-cast");
  container.innerHTML = "";

  cast.slice(0, 12).forEach((person) => {
    const card = document.createElement("article");
    card.className = "cast-card";

    const image = document.createElement("img");
    image.src = person.profile_path
      ? `${imageBase}w342${person.profile_path}`
      : "./assets/images/img1.png";
    image.alt = person.name;

    const name = document.createElement("h4");
    name.textContent = person.name;

    const character = document.createElement("span");
    character.textContent = person.character || "Elenco";

    card.append(image, name, character);
    container.appendChild(card);
  });

  if (!cast.length) {
    container.innerHTML = "<p>Elenco indisponível.</p>";
  }
}

function renderSimilar(items) {
  const container = document.getElementById("similar-movies");
  container.innerHTML = "";

  items.slice(0, 12).forEach((item) => {
    const card = document.createElement("article");
    card.className = "film-card";
    card.addEventListener("click", () => {
      const page = type === "tv" ? "serie-details.html" : "movie-details.html";
      window.location.href = `${page}?id=${item.id}&type=${type}`;
    });

    const image = document.createElement("img");
    image.src = item.poster_path
      ? `${imageBase}w342${item.poster_path}`
      : "./assets/images/img1.png";
    image.alt = item.title || item.name;

    const title = document.createElement("h4");
    title.textContent = item.title || item.name;

    card.append(image, title);
    container.appendChild(card);
  });

  if (!items.length) {
    container.innerHTML = "<p>Não há recomendações disponíveis.</p>";
  }
}

function renderSeasons(seasons) {
  const select = document.getElementById("season-select");
  if (!select) return;

  const validSeasons = seasons.filter(
    (season) => season.season_number > 0 && season.episode_count > 0,
  );

  select.innerHTML = "";

  if (!validSeasons.length) {
    select.innerHTML = '<option value="">Sem temporadas</option>';
    document.getElementById("episode-list").innerHTML =
      "<p>Temporadas indisponíveis.</p>";
    return;
  }

  validSeasons.forEach((season) => {
    const option = document.createElement("option");
    option.value = season.season_number;
    option.textContent =
      season.name || `Temporada ${season.season_number}`;
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    loadEpisodes(Number(select.value));
  });

  loadEpisodes(validSeasons[0].season_number);
}

async function loadEpisodes(seasonNumber) {
  const container = document.getElementById("episode-list");
  if (!container) return;

  container.innerHTML = "<p>Carregando episódios...</p>";

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=pt-BR`,
    );

    if (!response.ok) {
      throw new Error("Não foi possível carregar os episódios.");
    }

    const season = await response.json();
    container.innerHTML = "";

    (season.episodes || []).forEach((episode) => {
      const card = document.createElement("article");
      card.className = "episode-card";

      const imageWrapper = document.createElement("div");
      imageWrapper.className = "episode-card__image";

      const image = document.createElement("img");
      image.src = episode.still_path
        ? `${imageBase}w500${episode.still_path}`
        : "./assets/images/img1.png";
      image.alt = episode.name;

      const number = document.createElement("span");
      number.className = "episode-card__number";
      number.textContent = `Episódio ${episode.episode_number}`;

      imageWrapper.append(image, number);

      const content = document.createElement("div");
      content.className = "episode-card__content";

      const titleRow = document.createElement("div");
      titleRow.className = "episode-card__title-row";

      const title = document.createElement("h3");
      title.textContent = episode.name || `Episódio ${episode.episode_number}`;

      const runtime = document.createElement("span");
      runtime.className = "episode-card__runtime";
      runtime.textContent = episode.runtime
        ? `${episode.runtime} min`
        : episode.air_date || "-";

      titleRow.append(title, runtime);

      const description = document.createElement("p");
      description.textContent =
        episode.overview || "Descrição indisponível.";
      description.title = episode.overview || "";

      content.append(titleRow, description);
      card.append(imageWrapper, content);
      container.appendChild(card);
    });

    if (!season.episodes?.length) {
      container.innerHTML = "<p>Esta temporada não possui episódios.</p>";
    }
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Não foi possível carregar os episódios.</p>";
  }
}

loadDetails();
