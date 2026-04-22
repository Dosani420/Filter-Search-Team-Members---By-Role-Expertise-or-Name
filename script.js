const searchInput = document.getElementById("searchInput");
const roleFiltersContainer = document.getElementById("roleFilters");
const teamGrid = document.getElementById("teamGrid");
const noResults = document.getElementById("noResults");
const resetBtn = document.getElementById("resetBtn");
const resultsMeta = document.getElementById("resultsMeta");

const STORAGE_KEY = "team-directory-search";
const STORAGE_ROLES_KEY = "team-directory-selected-roles";
const DEBOUNCE_DELAY = 250;

let teamMembers = [];
let selectedRoles = new Set();
let searchQuery = "";

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function getHighlightedFragments(text, query) {
  const source = String(text || "");
  const trimmedQuery = String(query || "").trim();
  if (!trimmedQuery) {
    return [{ text: source, match: false }];
  }

  const safeQuery = escapeRegExp(trimmedQuery);
  const regex = new RegExp(safeQuery, "ig");
  const fragments = [];
  let currentIndex = 0;
  let result = regex.exec(source);

  while (result) {
    const matchStart = result.index;
    const matchText = result[0];
    if (matchStart > currentIndex) {
      fragments.push({ text: source.slice(currentIndex, matchStart), match: false });
    }
    fragments.push({ text: matchText, match: true });
    currentIndex = matchStart + matchText.length;
    result = regex.exec(source);
  }

  if (currentIndex < source.length) {
    fragments.push({ text: source.slice(currentIndex), match: false });
  }

  return fragments.length ? fragments : [{ text: source, match: false }];
}

function appendHighlightedText(parent, text, query) {
  const fragments = getHighlightedFragments(text, query);
  fragments.forEach((fragment) => {
    const node = fragment.match ? document.createElement("mark") : document.createTextNode(fragment.text);
    if (fragment.match) {
      node.textContent = fragment.text;
    }
    parent.appendChild(node);
  });
}

function matchesSearch(member, query) {
  const q = normalizeText(query);
  if (!q) return true;

  const name = normalizeText(member.name);
  const role = normalizeText(member.role);
  const skills = Array.isArray(member.skills) ? member.skills.join(" ") : "";
  const normalizedSkills = normalizeText(skills);

  return name.includes(q) || role.includes(q) || normalizedSkills.includes(q);
}

function matchesRole(member) {
  if (selectedRoles.size === 0) return true;
  return selectedRoles.has(member.role);
}

function buildRoleFilters(members) {
  const roles = [...new Set(members.map((m) => m.role))].sort((a, b) => a.localeCompare(b));
  roleFiltersContainer.innerHTML = "";

  roles.forEach((role) => {
    const label = document.createElement("label");
    label.className = "role-option";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = role;
    input.checked = selectedRoles.has(role);

    if (input.checked) {
      label.classList.add("active");
    }

    input.addEventListener("change", () => {
      if (input.checked) {
        selectedRoles.add(role);
        label.classList.add("active");
      } else {
        selectedRoles.delete(role);
        label.classList.remove("active");
      }
      persistFilters();
      render();
    });

    label.appendChild(input);
    label.append(` ${role}`);
    roleFiltersContainer.appendChild(label);
  });
}

function createMemberCard(member, query) {
  const card = document.createElement("article");
  card.className = "member-card";
  card.setAttribute("tabindex", "0");

  const image = document.createElement("img");
  image.src = member.image_url;
  image.alt = member.name;
  image.loading = "lazy";

  const content = document.createElement("div");
  content.className = "card-content";

  const name = document.createElement("h3");
  appendHighlightedText(name, member.name, query);

  const role = document.createElement("p");
  role.className = "role";
  appendHighlightedText(role, member.role, query);

  const bio = document.createElement("p");
  bio.className = "bio";
  bio.textContent = member.bio || "";

  const skillsWrap = document.createElement("div");
  skillsWrap.className = "skills";

  (member.skills || []).forEach((skill) => {
    const chip = document.createElement("span");
    appendHighlightedText(chip, skill, query);
    skillsWrap.appendChild(chip);
  });

  content.append(name, role, bio, skillsWrap);
  card.append(image, content);

  return card;
}

function persistFilters() {
  localStorage.setItem(STORAGE_KEY, searchQuery);
  localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify([...selectedRoles]));
}

function loadSavedFilters() {
  searchQuery = localStorage.getItem(STORAGE_KEY) || "";
  searchInput.value = searchQuery;

  try {
    const savedRoles = JSON.parse(localStorage.getItem(STORAGE_ROLES_KEY) || "[]");
    if (Array.isArray(savedRoles)) {
      selectedRoles = new Set(savedRoles);
    }
  } catch {
    selectedRoles = new Set();
  }
}

function render() {
  teamGrid.setAttribute("aria-busy", "true");
  const filteredMembers = teamMembers.filter(
    (member) => matchesRole(member) && matchesSearch(member, searchQuery)
  );

  teamGrid.innerHTML = "";
  filteredMembers.forEach((member) => {
    teamGrid.appendChild(createMemberCard(member, searchQuery));
  });
  teamGrid.classList.toggle("single-result", filteredMembers.length === 1);

  noResults.classList.toggle("hidden", filteredMembers.length > 0);
  resultsMeta.textContent = `Showing ${filteredMembers.length} of ${teamMembers.length} team members`;
  teamGrid.setAttribute("aria-busy", "false");
}

function resetFilters() {
  searchQuery = "";
  selectedRoles.clear();
  searchInput.value = "";
  persistFilters();
  buildRoleFilters(teamMembers);
  render();
}

async function init() {
  try {
    resultsMeta.textContent = "Loading team members...";
    const response = await fetch("./team.json");
    if (!response.ok) throw new Error("Failed to load team data.");
    teamMembers = await response.json();
    if (!Array.isArray(teamMembers)) {
      throw new Error("Invalid data format.");
    }

    loadSavedFilters();
    buildRoleFilters(teamMembers);
    render();
  } catch (error) {
    teamGrid.innerHTML = "";
    noResults.classList.remove("hidden");
    noResults.classList.add("error-state");
    noResults.textContent = "Unable to load team members data";
    resultsMeta.textContent = "";
    teamGrid.setAttribute("aria-busy", "false");
    console.error(error);
  }
}

const debouncedSearch = debounce((value) => {
  searchQuery = value;
  persistFilters();
  render();
}, DEBOUNCE_DELAY);

searchInput.addEventListener("input", (event) => {
  debouncedSearch(event.target.value);
});

resetBtn.addEventListener("click", resetFilters);

init();
