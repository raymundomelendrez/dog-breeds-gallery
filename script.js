// script.js

document.addEventListener("DOMContentLoaded", () => {
    const fetchBreedsButton = document.getElementById("fetch-breeds");
    const breedContainer = document.getElementById("breed-container");
    const loader = document.getElementById("loader");
    const modal = document.getElementById("modal");
    const imageModal = document.getElementById("image-modal");
    const modalContent = {
        name: document.getElementById("modal-breed-name"),
        image: document.getElementById("modal-breed-image"),
        info: document.getElementById("modal-breed-info"),
        additionalImages: document.getElementById("modal-additional-images"),
    };
    const fullSizeImage = document.getElementById("full-size-image");
    const closeModalButton = document.querySelector(".close");
    const closeImageModalButton = document.getElementById("close-image-modal");

    fetchBreedsButton.addEventListener("click", fetchAndDisplayBreeds);

    closeModalButton.addEventListener("click", closeModal);
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    closeImageModalButton.addEventListener("click", closeImageModal);
    window.addEventListener("click", (event) => {
        if (event.target === imageModal) {
            closeImageModal();
        }
    });

    async function fetchAndDisplayBreeds() {
        breedContainer.innerHTML = "";
        showLoader();

        try {
            const breeds = await fetchBreedsList();
            const breedImages = await fetchBreedImages(breeds);
            displayBreeds(breedImages);
        } catch (error) {
            console.error("Error fetching breeds:", error);
            breedContainer.innerHTML = "<p>Failed to load dog breeds. Please try again later.</p>";
        } finally {
            hideLoader();
        }
    }

    async function fetchBreedsList() {
        const response = await fetch("https://dog.ceo/api/breeds/list/all");
        const data = await response.json();

        if (data.status !== "success") {
            throw new Error("Failed to fetch breed list");
        }

        const breeds = Object.keys(data.message);
        breeds.sort();
        return breeds;
    }

    async function fetchBreedImages(breeds) {
        const fetchPromises = breeds.map(async (breed) => {
            const response = await fetch(`https://dog.ceo/api/breed/${breed}/images/random`);
            const data = await response.json();

            if (data.status !== "success") {
                console.warn(`Failed to fetch image for breed: ${breed}`);
                return { breed, imageUrl: "placeholder.jpg" }; // Placeholder image in case of failure
            }

            return { breed, imageUrl: data.message };
        });

        return Promise.all(fetchPromises);
    }

    function displayBreeds(breedImages) {
        breedImages.forEach(({ breed, imageUrl }) => {
            const card = document.createElement("div");
            card.classList.add("card");

            const img = document.createElement("img");
            img.src = imageUrl;
            img.alt = `${breed}`;
            img.loading = "lazy"; // Enable lazy loading for images

            const breedName = document.createElement("div");
            breedName.classList.add("breed-name");
            breedName.textContent = breed;

            card.appendChild(img);
            card.appendChild(breedName);
            card.addEventListener("click", () => openModal(breed, imageUrl));
            breedContainer.appendChild(card);
        });
    }

    async function openModal(breed, imageUrl) {
        modalContent.name.textContent = breed;
        modalContent.image.src = imageUrl;
        modalContent.info.textContent = "Loading breed information...";
        modalContent.additionalImages.innerHTML = "Loading more images...";

        try {
            const breedInfo = await fetchBreedInfo(breed);
            modalContent.info.textContent = breedInfo;
        } catch (error) {
            modalContent.info.textContent = "Information about this breed is not available.";
        }

        fetchMoreImages(breed).then(images => {
            modalContent.additionalImages.innerHTML = images.map(imgUrl => `<img src="${imgUrl}" alt="${breed}" class="modal-image" onclick="openImageModal('${imgUrl}')">`).join("");
        }).catch(() => {
            modalContent.additionalImages.innerHTML = "Failed to load additional images.";
        });

        modal.style.display = "flex";
    }

    async function fetchBreedInfo(breed) {
        const response = await fetch(`https://api.thedogapi.com/v1/breeds/search?q=${breed}`);
        const data = await response.json();

        if (data.length === 0) {
            throw new Error("Breed information not found");
        }

        const breedData = data[0];
        return `${breedData.name}: ${breedData.temperament}. Life expectancy: ${breedData.life_span}.`;
    }

    function closeModal() {
        modal.style.display = "none";
    }

    async function fetchMoreImages(breed) {
        const response = await fetch(`https://dog.ceo/api/breed/${breed}/images`);
        const data = await response.json();

        if (data.status !== "success") {
            throw new Error("Failed to fetch more images");
        }

        return data.message.slice(0, 5); // Limit to 5 additional images for modal
    }

    // Full-Size Image Modal Functions
    function openImageModal(imageUrl) {
        fullSizeImage.src = imageUrl;
        imageModal.style.display = "flex";
    }

    function closeImageModal() {
        imageModal.style.display = "none";
    }

    function showLoader() {
        loader.hidden = false;
        fetchBreedsButton.disabled = true;
    }

    function hideLoader() {
        loader.hidden = true;
        fetchBreedsButton.disabled = false;
    }

    // Attach the openImageModal function to the window object to be accessible globally
    window.openImageModal = openImageModal;
});
