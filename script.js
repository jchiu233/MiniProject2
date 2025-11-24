//script.js
//Mini Project 2 

// Course class
class Course {
    constructor(id, title, department, level, credits, instructor, semester, description) {
        this.id = id;
        this.title = title;
        this.department = department;
        this.level = level;
        this.credits = credits;
        this.instructor = instructor;
        this.semester = semester;
        this.description = description;
    }

    // Create a Course instance from a plain object
    static fromObject(obj, index) {
        const id = obj.id || `UNKNOWN_${index}`;
        const title = obj.title || "Unknown Title";
        const department = obj.department || "Unknown Department";
        const level = typeof obj.level === "number" ? obj.level : NaN;
        const credits = typeof obj.credits === "number" ? obj.credits : NaN;
        const instructor = obj.instructor ? obj.instructor : "TBA";
        const semester = obj.semester || "Unknown Semester";
        const description = obj.description || "No description available.";

        return new Course(id, title, department, level, credits, instructor, semester, description);
    }
}

// Global state
let allCourses = [];      // All Course objects
let filteredCourses = []; // After filters + sorting

// DOM references 
const fileInput = document.getElementById("fileInput");
const errorBox = document.getElementById("errorBox");

const filterDepartment = document.getElementById("filterDepartment");
const filterLevel = document.getElementById("filterLevel");
const filterCredits = document.getElementById("filterCredits");
const filterInstructor = document.getElementById("filterInstructor");
const filterSemester = document.getElementById("filterSemester");

const clearFiltersBtn = document.getElementById("clearFilters");
const sortSelect = document.getElementById("sortSelect");

const courseList = document.getElementById("courseList");
const courseDetails = document.getElementById("courseDetails");

// Helper: show / clear errors
function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
}

function clearError() {
    errorBox.textContent = "";
    errorBox.classList.add("hidden");
}

// Semester parsing for sorting
function semesterToKey(semesterStr) {
    if (!semesterStr || typeof semesterStr !== "string") {
        return Number.POSITIVE_INFINITY;
    }

    const parts = semesterStr.trim().split(" ");
    if (parts.length !== 2) return Number.POSITIVE_INFINITY;

    const term = parts[0];
    const year = parseInt(parts[1], 10);
    if (isNaN(year)) return Number.POSITIVE_INFINITY;

    const order = {
        Winter: 1,
        Spring: 2,
        Summer: 3,
        Fall: 4
    };

    const termOrder = order[term] || 5;
    return year * 10 + termOrder; // e.g. 2026*10+4
}

// Build filter dropdowns using Sets
function populateFilters() {
    filterDepartment.innerHTML = '<option value="All">All</option>';
    filterLevel.innerHTML = '<option value="All">All</option>';
    filterCredits.innerHTML = '<option value="All">All</option>';
    filterInstructor.innerHTML = '<option value="All">All</option>';
    filterSemester.innerHTML = '<option value="All">All</option>';

    const deptSet = new Set();
    const levelSet = new Set();
    const creditSet = new Set();
    const instructorSet = new Set();
    const semesterSet = new Set();

    allCourses.forEach(course => {
        if (course.department) deptSet.add(course.department);
        if (!isNaN(course.level)) levelSet.add(course.level);
        if (!isNaN(course.credits)) creditSet.add(course.credits);
        if (course.instructor) instructorSet.add(course.instructor);
        if (course.semester) semesterSet.add(course.semester);
    });

    function appendOptions(select, values) {
        values.forEach(v => {
            const opt = document.createElement("option");
            opt.value = String(v);
            opt.textContent = String(v);
            select.appendChild(opt);
        });
    }

    appendOptions(filterDepartment, Array.from(deptSet).sort());
    appendOptions(filterLevel, Array.from(levelSet).sort((a, b) => a - b));
    appendOptions(filterCredits, Array.from(creditSet).sort((a, b) => a - b));
    appendOptions(filterInstructor, Array.from(instructorSet).sort());
    appendOptions(filterSemester, Array.from(semesterSet).sort((a, b) => semesterToKey(a) - semesterToKey(b)));

    filterDepartment.disabled = false;
    filterLevel.disabled = false;
    filterCredits.disabled = false;
    filterInstructor.disabled = false;
    filterSemester.disabled = false;
    sortSelect.disabled = false;
}

// Filtering and sorting
function applyFiltersAndSorting() {
    if (allCourses.length === 0) {
        filteredCourses = [];
        renderCourseList();
        courseDetails.innerHTML = "<p>No courses loaded.</p>";
        return;
    }

    filteredCourses = allCourses.filter(course => {
        if (filterDepartment.value !== "All" &&
            course.department !== filterDepartment.value) {
            return false;
        }

        if (filterLevel.value !== "All") {
            const levelValue = parseInt(filterLevel.value, 10);
            if (isNaN(levelValue) || course.level !== levelValue) {
                return false;
            }
        }

        if (filterCredits.value !== "All") {
            const creditsValue = parseInt(filterCredits.value, 10);
            if (isNaN(creditsValue) || course.credits !== creditsValue) {
                return false;
            }
        }

        if (filterInstructor.value !== "All" &&
            course.instructor !== filterInstructor.value) {
            return false;
        }

        if (filterSemester.value !== "All" &&
            course.semester !== filterSemester.value) {
            return false;
        }

        return true;
    });

    const sortValue = sortSelect.value;

    if (sortValue === "id-asc") {
        filteredCourses.sort((a, b) => a.id.localeCompare(b.id));
    } else if (sortValue === "id-desc") {
        filteredCourses.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortValue === "title-asc") {
        filteredCourses.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortValue === "title-desc") {
        filteredCourses.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortValue === "sem-asc") {
        filteredCourses.sort(
            (a, b) => semesterToKey(a.semester) - semesterToKey(b.semester)
        );
    } else if (sortValue === "sem-desc") {
        filteredCourses.sort(
            (a, b) => semesterToKey(b.semester) - semesterToKey(a.semester)
        );
    }

    renderCourseList();

    if (filteredCourses.length > 0) {
        showCourseDetails(filteredCourses[0]);
        highlightActiveItem(filteredCourses[0].id);
    } else {
        courseDetails.innerHTML = "<p>No courses match the selected filters.</p>";
    }
}

// Rendering
function renderCourseList() {
    courseList.innerHTML = "";

    if (filteredCourses.length === 0) {
        courseList.textContent = "No courses to display.";
        return;
    }

    filteredCourses.forEach(course => {
        const div = document.createElement("div");
        div.className = "course-item";
        div.textContent = course.id;

        div.addEventListener("click", () => {
            showCourseDetails(course);
            highlightActiveItem(course.id);
        });

        courseList.appendChild(div);
    });
}

function highlightActiveItem(courseId) {
    const buttons = document.querySelectorAll(".course-item");
    buttons.forEach(btn => {
        if (btn.textContent === courseId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

function showCourseDetails(course) {
    const levelText = isNaN(course.level) ? "Unknown" : course.level;
    const creditsText = isNaN(course.credits) ? "Unknown" : course.credits;

    courseDetails.innerHTML = `
        <h2>${course.id}</h2>
        <p><strong>Title:</strong> ${course.title}</p>
        <p><strong>Department:</strong> ${course.department}</p>
        <p><strong>Level:</strong> ${levelText}</p>
        <p><strong>Credits:</strong> ${creditsText}</p>
        <p><strong>Instructor:</strong> ${course.instructor}</p>
        <p><strong>Semester:</strong> ${course.semester}</p>
        <p>${course.description}</p>
    `;
}

// File loading
fileInput.addEventListener("change", function () {
    clearError();
    courseList.innerHTML = "";
    courseDetails.innerHTML = "<p>Loading courses…</p>";

    const file = this.files[0];
    if (!file) {
        showError("Please select a JSON file.");
        courseDetails.innerHTML = "<p>No file selected.</p>";
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const text = e.target.result;
            const rawData = JSON.parse(text);

            if (!Array.isArray(rawData)) {
                throw new Error("Root JSON value is not an array.");
            }

            allCourses = rawData.map((obj, index) => Course.fromObject(obj, index));
            populateFilters();
            applyFiltersAndSorting();
        } catch (err) {
            showError("Invalid JSON file format.");
            console.error(err);
            allCourses = [];
            filteredCourses = [];
            courseList.innerHTML = "";
            courseDetails.innerHTML = "<p>Unable to load courses.</p>";
        }
    };

    reader.onerror = function () {
        showError("Error reading file.");
        courseDetails.innerHTML = "<p>Unable to load courses.</p>";
    };

    reader.readAsText(file);
});

// Event listeners for filters/sorting
filterDepartment.addEventListener("change", applyFiltersAndSorting);
filterLevel.addEventListener("change", applyFiltersAndSorting);
filterCredits.addEventListener("change", applyFiltersAndSorting);
filterInstructor.addEventListener("change", applyFiltersAndSorting);
filterSemester.addEventListener("change", applyFiltersAndSorting);
sortSelect.addEventListener("change", applyFiltersAndSorting);
clearFiltersBtn.addEventListener("click", () => {
    filterDepartment.value = "All";
    filterLevel.value = "All";
    filterCredits.value = "All";
    filterInstructor.value = "All";
    filterSemester.value = "All";
    sortSelect.value = "none";
    applyFiltersAndSorting();
});


