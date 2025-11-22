// Mini Project 2 - Course Explorer
// Student Name: Your Name
// Student Number: 000000000
// File: script.js
//
// Loads course data from a JSON file, wraps each entry in a Course class,
// and supports filtering + sorting via array methods and DOM updates.

// ------------- Global state -------------

/** @type {Course[]} */
let allCourses = [];
/** @type {Course[]} */
let currentCourses = [];

// DOM references
let fileInput;
let errorArea;
let courseListDiv;
let courseDetailsDiv;

// Filter selects
let filterDepartment;
let filterLevel;
let filterCredits;
let filterInstructor;
let filterSemester;

// Sorting
let sortSelect;
let clearFiltersButton;

// ------------- Course class -------------

class Course {
    /**
     * Construct a Course from a raw data object.
     * Expected fields: id, title, department, level,
     * credits, instructor, description, semester.
     */
    constructor(raw) {
        this.id = raw.id || "Unknown ID";
        this.title = raw.title || "Untitled Course";
        this.department = raw.department || "Unknown Department";
        this.level = (raw.level !== undefined && raw.level !== null)
            ? raw.level
            : "Unknown";
        this.credits = (raw.credits !== undefined && raw.credits !== null)
            ? raw.credits
            : "Unknown";
        this.instructor = raw.instructor || "TBA";
        this.description = raw.description || "No description provided.";
        this.semester = raw.semester || "Unknown Semester";
    }

    /**
     * Short label used in the course list.
     */
    getListLabel() {
        return this.id + ": " + this.title;
    }

    /**
     * Create a DOM element containing detailed information about the course.
     */
    createDetailsElement() {
        const container = document.createElement("div");

        const titleEl = document.createElement("h3");
        titleEl.textContent = this.title + " (" + this.id + ")";
        container.appendChild(titleEl);

        const pDept = document.createElement("p");
        pDept.textContent = "Department: " + this.department;
        container.appendChild(pDept);

        const pLevel = document.createElement("p");
        pLevel.textContent = "Level: " + this.level;
        container.appendChild(pLevel);

        const pCredits = document.createElement("p");
        pCredits.textContent = "Credits: " + this.credits;
        container.appendChild(pCredits);

        const pInstructor = document.createElement("p");
        pInstructor.textContent = "Instructor: " + this.instructor;
        container.appendChild(pInstructor);

        const pSemester = document.createElement("p");
        pSemester.textContent = "Semester: " + this.semester;
        container.appendChild(pSemester);

        const pDesc = document.createElement("p");
        pDesc.textContent = "Description: " + this.description;
        container.appendChild(pDesc);

        return container;
    }
}

// ------------- Initialization -------------

window.addEventListener("DOMContentLoaded", () => {
    fileInput = document.getElementById("file-input");
    errorArea = document.getElementById("error-area");
    courseListDiv = document.getElementById("course-list");
    courseDetailsDiv = document.getElementById("course-details");

    filterDepartment = document.getElementById("filter-department");
    filterLevel = document.getElementById("filter-level");
    filterCredits = document.getElementById("filter-credits");
    filterInstructor = document.getElementById("filter-instructor");
    filterSemester = document.getElementById("filter-semester");

    sortSelect = document.getElementById("sort-option");
    clearFiltersButton = document.getElementById("clear-filters");

    fileInput.addEventListener("change", handleFileSelect);

    filterDepartment.addEventListener("change", updateDisplay);
    filterLevel.addEventListener("change", updateDisplay);
    filterCredits.addEventListener("change", updateDisplay);
    filterInstructor.addEventListener("change", updateDisplay);
    filterSemester.addEventListener("change", updateDisplay);

    clearFiltersButton.addEventListener("click", () => {
        resetFilters();
        updateDisplay();
    });

    sortSelect.addEventListener("change", updateDisplay);
});

// ------------- File loading & parsing -------------

/**
 * Handle file selection from <input type="file">.
 * Uses FileReader to read text and JSON.parse to create Course objects.
 */
function handleFileSelect(event) {
    clearError();
    courseDetailsDiv.innerHTML =
        '<p class="hint">Click a course on the left to see its details here.</p>';

    const file = event.target.files[0];
    if (!file) {
        showError("No file selected.");
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const text = reader.result;
            const rawData = JSON.parse(text);

            if (!Array.isArray(rawData)) {
                throw new Error("JSON does not contain an array of courses.");
            }

            allCourses = rawData.map(obj => new Course(obj));

            populateFilterDropdowns(allCourses);
            updateDisplay();
        } catch (err) {
            showError("Error reading JSON: " + err.message);
            allCourses = [];
            currentCourses = [];
            renderCourseList([]);
        }
    };

    reader.onerror = () => {
        showError("Failed to read file.");
    };

    reader.readAsText(file);
}

// ------------- Filters & sorting -------------

/**
 * Populate dropdown filter options using unique values from the data.
 * Uses Set to gather unique values (as required).
 */
function populateFilterDropdowns(courses) {
    function setOptions(selectElement, values) {
        selectElement.innerHTML = "";
        const allOption = document.createElement("option");
        allOption.value = "all";
        allOption.textContent = "All";
        selectElement.appendChild(allOption);

        values.forEach(value => {
            const opt = document.createElement("option");
            opt.value = String(value);
            opt.textContent = String(value);
            selectElement.appendChild(opt);
        });
    }

    const departments = new Set();
    const levels = new Set();
    const credits = new Set();
    const instructors = new Set();
    const semesters = new Set();

    for (const c of courses) {
        if (c.department) departments.add(c.department);
        if (c.level !== "Unknown") levels.add(c.level);
        if (c.credits !== "Unknown") credits.add(c.credits);
        if (c.instructor) instructors.add(c.instructor);
        if (c.semester) semesters.add(c.semester);
    }

    const departmentsArr = Array.from(departments).sort();
    const levelsArr = Array.from(levels).sort((a, b) => Number(a) - Number(b));
    const creditsArr = Array.from(credits).sort((a, b) => Number(a) - Number(b));
    const instructorsArr = Array.from(instructors).sort();
    const semestersArr = Array.from(semesters).sort(compareSemesterAscending);

    setOptions(filterDepartment, departmentsArr);
    setOptions(filterLevel, levelsArr);
    setOptions(filterCredits, creditsArr);
    setOptions(filterInstructor, instructorsArr);
    setOptions(filterSemester, semestersArr);

    resetFilters();
}

/**
 * Reset all filters and sorting.
 */
function resetFilters() {
    filterDepartment.value = "all";
    filterLevel.value = "all";
    filterCredits.value = "all";
    filterInstructor.value = "all";
    filterSemester.value = "all";
    sortSelect.value = "none";
}

/**
 * Recompute the current visible courses based on filters + sorting,
 * and re-render the course list.
 * Uses Array.prototype.filter and Array.prototype.sort.
 */
function updateDisplay() {
    if (!allCourses || allCourses.length === 0) {
        renderCourseList([]);
        return;
    }

    currentCourses = allCourses.filter(course => {
        if (filterDepartment.value !== "all" &&
            String(course.department) !== filterDepartment.value) {
            return false;
        }
        if (filterLevel.value !== "all" &&
            String(course.level) !== filterLevel.value) {
            return false;
        }
        if (filterCredits.value !== "all" &&
            String(course.credits) !== filterCredits.value) {
            return false;
        }
        if (filterInstructor.value !== "all" &&
            String(course.instructor) !== filterInstructor.value) {
            return false;
        }
        if (filterSemester.value !== "all" &&
            String(course.semester) !== filterSemester.value) {
            return false;
        }
        return true;
    });

    const sortValue = sortSelect.value;
    if (sortValue !== "none") {
        currentCourses.sort((a, b) => compareCourses(a, b, sortValue));
    }

    renderCourseList(currentCourses);

    courseDetailsDiv.innerHTML =
        '<p class="hint">Click a course on the left to see its details here.</p>';
}

/**
 * Compare function for different sorting options.
 */
function compareCourses(a, b, sortValue) {
    switch (sortValue) {
        case "title-asc":
            return a.title.localeCompare(b.title);
        case "title-desc":
            return b.title.localeCompare(a.title);
        case "id-asc":
            return a.id.localeCompare(b.id);
        case "id-desc":
            return b.id.localeCompare(a.id);
        case "semester-asc":
            return compareSemesterAscending(a.semester, b.semester);
        case "semester-desc":
            return -compareSemesterAscending(a.semester, b.semester);
        default:
            return 0;
    }
}

/**
 * Compare two semester strings like "Fall 2025".
 * Winter < Spring < Summer < Fall within the same year.
 */
function compareSemesterAscending(semA, semB) {
    const parsedA = parseSemester(semA);
    const parsedB = parseSemester(semB);

    if (parsedA.year !== parsedB.year) {
        return parsedA.year - parsedB.year;
    }
    return parsedA.termOrder - parsedB.termOrder;
}

/**
 * Convert "Fall 2025" → { year: 2025, termOrder: 4 }.
 * If parsing fails, push to the end.
 */
function parseSemester(sem) {
    const parts = sem.trim().split(" ");
    if (parts.length !== 2) {
        return { year: Number.MAX_SAFE_INTEGER, termOrder: 99 };
    }

    const season = parts[0];
    const year = Number(parts[1]) || Number.MAX_SAFE_INTEGER;

    let termOrder;
    switch (season) {
        case "Winter":
            termOrder = 1;
            break;
        case "Spring":
            termOrder = 2;
            break;
        case "Summer":
            termOrder = 3;
            break;
        case "Fall":
            termOrder = 4;
            break;
        default:
            termOrder = 99;
    }

    return { year, termOrder };
}

// ------------- Rendering -------------

/**
 * Render a list of courses into the #course-list div.
 */
function renderCourseList(courses) {
    courseListDiv.innerHTML = "";

    if (!courses || courses.length === 0) {
        const p = document.createElement("p");
        p.textContent = "No courses to display. Try loading data or changing filters.";
        courseListDiv.appendChild(p);
        return;
    }

    courses.forEach(course => {
        const item = document.createElement("div");
        item.className = "course-item";

        const title = document.createElement("strong");
        title.textContent = course.getListLabel();
        item.appendChild(title);

        const smallInfo = document.createElement("span");
        smallInfo.textContent =
            "Department: " + course.department +
            " | Level: " + course.level +
            " | Semester: " + course.semester;
        item.appendChild(smallInfo);

        item.addEventListener("click", () => {
            showCourseDetails(course);
        });

        courseListDiv.appendChild(item);
    });
}

/**
 * Show details for a single course in the details panel.
 */
function showCourseDetails(course) {
    courseDetailsDiv.innerHTML = "";
    const detailsEl = course.createDetailsElement();
    courseDetailsDiv.appendChild(detailsEl);
}

// ------------- Error handling helpers -------------

function showError(msg) {
    errorArea.textContent = msg;
    errorArea.classList.remove("hidden");
}

function clearError() {
    errorArea.textContent = "";
    errorArea.classList.add("hidden");
}
