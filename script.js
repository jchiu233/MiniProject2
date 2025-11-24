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
        // Provide safe defaults for missing data
        const id = obj.id || `UNKNOWN_${index}`;
        const title = obj.title || "Unknown Title";
        const department = obj.department || "Unknown Department";
        const level = typeof obj.level === "number" ? obj.level : NaN;
        const credits = typeof obj.credits === "number" ? obj.credits : NaN;

        // Null or missing instructor 
        const instructor = obj.instructor ? obj.instructor : "TBA";

        const semester = obj.semester || "Unknown Semester";
        const description = obj.description || "No description available.";

        return new Course(id, title, department, level, credits, instructor, semester, description);
    }
}

// Global state
let allCourses = [];    // All Course objects
let filteredCourses = []; // After filters + sorting

// DOM references
const fileInput = document.getElementById("file-input");
const fileNameSpan = document.getElementById("file-name");
const errorMessage = document.getElementById("error-message");

const departmentFilter = document.getElementById("department-filter");
const levelFilter = document.getElementById("level-filter");
const creditsFilter = document.getElementById("credits-filter");
const instructorFilter = document.getElementById("instructor-filter");
const sortSelect = document.getElementById("sort-select");

const courseList = document.getElementById("course-list");
const courseDetails = document.getElementById("course-details");

// Helper: show / clear errors
function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.style.display = "block";
}

function clearError() {
    errorMessage.textContent = "";
    errorMessage.style.display = "none";
}

// Semester parsing for sorting
function semesterToKey(semesterStr) {
    if (!semesterStr || typeof semesterStr !== "string") {
        return Number.POSITIVE_INFINITY; // unknown semesters go last
    }

    const parts = semesterStr.split(" ");
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
    // e.g. 2026*10 + 4
    return year * 10 + termOrder;
}

// Build filter dropdowns using Sets
function populateFilters() {
    // Start with "All" options
    departmentFilter.innerHTML = '<option value="All">All</option>';
    levelFilter.innerHTML = '<option value="All">All</option>';
    creditsFilter.innerHTML = '<option value="All">All</option>';
    instructorFilter.innerHTML = '<option value="All">All</option>';

    const deptSet = new Set();
    const levelSet = new Set();
    const creditSet = new Set();
    const instructorSet = new Set();

    allCourses.forEach(course => {
        if (course.department) deptSet.add(course.department);
        if (!isNaN(course.level)) levelSet.add(course.level);
        if (!isNaN(course.credits)) creditSet.add(course.credits);
        if (course.instructor) instructorSet.add(course.instructor);
    });

    // Helper to append options to a select from a sorted array
    function appendOptions(select, values) {
        values.forEach(v => {
            const opt = document.createElement("option");
            opt.value = String(v);
            opt.textContent = String(v);
            select.appendChild(opt);
        });
    }

    appendOptions(departmentFilter, Array.from(deptSet).sort());
    appendOptions(levelFilter, Array.from(levelSet).sort((a, b) => a - b));
    appendOptions(creditsFilter, Array.from(creditSet).sort((a, b) => a - b));
    appendOptions(instructorFilter, Array.from(instructorSet).sort());

    // Enable filters + sorting now that data is loaded
    departmentFilter.disabled = false;
    levelFilter.disabled = false;
    creditsFilter.disabled = false;
    instructorFilter.disabled = false;
    sortSelect.disabled = false;
}

// Filtering + sorting
function applyFiltersAndSorting() {
    if (allCourses.length === 0) {
        filteredCourses = [];
        renderCourseList();
        courseDetails.innerHTML = "<p>No courses loaded.</p>";
        return;
    }

    // Apply filters using Array.filter (required by rubric)
    filteredCourses = allCourses.filter(course => {
        // Department
        if (departmentFilter.value !== "All" &&
            course.department !== departmentFilter.value) {
            return false;
        }

        // Level
        if (levelFilter.value !== "All") {
            const levelValue = parseInt(levelFilter.value, 10);
            if (isNaN(levelValue) || course.level !== levelValue) {
                return false;
            }
        }

        // Credits
        if (creditsFilter.value !== "All") {
            const creditsValue = parseInt(creditsFilter.value, 10);
            if (isNaN(creditsValue) || course.credits !== creditsValue) {
                return false;
            }
        }

        // Instructor
        if (instructorFilter.value !== "All" &&
            course.instructor !== instructorFilter.value) {
            return false;
        }

        return true;
    });

    // Sorting
    const sortValue = sortSelect.value;

    if (sortValue === "id-asc") {
        filteredCourses.sort((a, b) => a.id.localeCompare(b.id));
    } else if (sortValue === "id-desc") {
        filteredCourses.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortValue === "title-asc") {
        filteredCourses.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortValue === "title-desc") {
        filteredCourses.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortValue === "semester-asc") {
        filteredCourses.sort(
            (a, b) => semesterToKey(a.semester) - semesterToKey(b.semester)
        );
    } else if (sortValue === "semester-desc") {
        filteredCourses.sort(
            (a, b) => semesterToKey(b.semester) - semesterToKey(a.semester)
        );
    }
    // "none" -> keep whatever order they already have

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

    filteredCourses.forEach(course => {
        const li = document.createElement("li");

        const button = document.createElement("button");
        button.textContent = course.id;
        button.className = "course-item";
        button.addEventListener("click", () => {
            showCourseDetails(course);
            highlightActiveItem(course.id);
        });

        li.appendChild(button);
        courseList.appendChild(li);
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

    fileNameSpan.textContent = file.name;

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const text = e.target.result;
            const rawData = JSON.parse(text);

            if (!Array.isArray(rawData)) {
                // For this project, we require an array as root
                throw new Error("Root JSON value is not an array.");
            }

            allCourses = rawData.map((obj, index) => Course.fromObject(obj, index));
            populateFilters();
            applyFiltersAndSorting();
        } catch (err) {
            // Show the exact required message for bad JSON
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

// Re-apply filters/sorting when any control changes
departmentFilter.addEventListener("change", applyFiltersAndSorting);
levelFilter.addEventListener("change", applyFiltersAndSorting);
creditsFilter.addEventListener("change", applyFiltersAndSorting);
instructorFilter.addEventListener("change", applyFiltersAndSorting);
sortSelect.addEventListener("change", applyFiltersAndSorting);



