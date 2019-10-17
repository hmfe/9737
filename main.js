/** UTILITY FUNCTIONS */

/**
 * 
 * @param {function} fn - function to be called
 * @param {int} time - timeout between function calls
 * 
 * Debounce prevents the input function to be called more than once every x ms
 */
const debounce = (fn, time) => {
  let timeout;
  return function() {
    const functionCall = () => fn.apply(this, arguments);
    
    clearTimeout(timeout);
    timeout = setTimeout(functionCall, time);
  }
}

/**
 * @param {object} el - element to clear
 */
const clearElement = el => el.innerHTML = '';

/**
 * @param {object} el - element to toggle visibility
 */
const toggleVisibility = el => el.classList.toggle('hidden');

/**
 * @param {object} el - element to dispay
 */
const displayElement = el => el.classList.remove('hidden');

/**
 * @param {object} el - element to hide
 */
const hideElement = el => el.classList.add('hidden');


/**
 * @param {string} searchPhrase - the phrase to search for
 */
const fetchFromApi = url => searchPhrase => {
  // Fetch data with the search phrase
  return fetch(encodeURI(url + searchPhrase))
    .then(response => response.json())
    .then(response => response)
    .catch(err => err);
}

/**
 * 
 * @param {date} date - the date to format
 */
const formatTimestamp = date => {
  // Get all date attributes, adds preceding zeros if needed
  const year = date.getFullYear();

  // Get month returns month between 0-11, add one to display in "swedish" format
  const month = (date.getMonth().toString().length + 1) === 1 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1;
  const day = date.getDate().toString().length === 1 ? "0" + date.getDate() : date.getDate();
  const hours = date.getHours().toString().length === 1 ? "0" + date.getHours() : date.getHours();
  const minutes = date.getMinutes().toString().length === 1 ? "0" + date.getMinutes() : date.getMinutes();

  return year + "-" + month + "-" + day + ", " + hours + ":" + minutes;
}

/**
 * 
 * @param {string} input - the string to check if faulty
 */
const preventFaultyInput = input => {
  // Only allow lower and uppercase characters, numbers and spaces
  const regex = new RegExp('^[A-Za-z0-9 _]*[A-Za-z0-9][A-Za-z0-9 _]*$');

  if(input.match(regex)) {
    return input;
  }

  return false;
};


/** SEARCH APPLICATION */

/** Elements */
const elementSearchField        = document.querySelector('.js-search');
const elementAutocomplete       = document.querySelector('.js-search-autocomplete')
const elementSearchHistory      = document.querySelector('.js-search-history')
const elementSearchHistoryItems = elementSearchHistory.querySelector('.js-search-history__items')
const elementSearchHistoryClear = elementSearchHistory.querySelector('.js-search-history__clear')
const elementSearchResults      = document.querySelector('.js-search-results')
const elementSearchResultsTitle = elementSearchResults.querySelector('.js-search-results__title')
const elementSearchResultsItems = elementSearchResults.querySelector('.js-search-results__items')

/** Curried functions to be called with the searchphrase */
const fetchTeams = fetchFromApi('https://www.thesportsdb.com/api/v1/json/1/searchteams.php?t=');
const fetchPlayers = fetchFromApi('https://www.thesportsdb.com/api/v1/json/1/searchplayers.php?t=');


/**
 * @param {object} e - event
 * 
 * Removes an item from the search history
 * Returns the removed item
 */
const removeSearchHistoryItem = e => {
  elementSearchHistoryItems.removeChild(e.target.parentNode);

  return e.target;
};

/**
 * Renders error message if invalid input
 */
const renderInvalidInput = () => {
  displayElement(elementAutocomplete);
  clearElement(elementAutocomplete);

  const errorLi = document.createElement('li');

  errorLi.className = 'search-box__autocomplete-error';
  errorLi.innerText = 'Invalid input';

  elementAutocomplete.appendChild(errorLi);
}

/**
 * @param {array} results - results from the API
 * @param {string} searchPhrase - the phrase to highlight in autocomplete
 */
const renderAutocomplete = (results, searchPhrase) => {
  displayElement(elementAutocomplete);
  clearElement(elementAutocomplete);

  results.forEach(element => {
    // Creates a span with the search phrase to highlight
    const highlightSearchPhrase = `<b>${searchPhrase}</b>`;
    
    // Replace the searchphrase in the name with highlighted search phrase
    const teamName = element.strTeam.toLowerCase().replace(searchPhrase.toLowerCase(), highlightSearchPhrase);
    const teamLi = document.createElement('li');
    teamLi.dataset.teamName = element.strTeam;
    teamLi.className = 'icon-sports icon-sports--' + element.strSport.toLowerCase().replace(' ', '-');
    teamLi.innerHTML = teamName;
    teamLi.tabIndex = 0;
    
    // Add click handler for every item in the autocomplete
    teamLi.addEventListener('click', () => onAutocompleteClick(element));
    
    // Add to autocomplete
    elementAutocomplete.appendChild(teamLi);
  });
}


/**
 * 
 * @param {string} team - the team to display in the search title
 */
const renderSearchTitle = team => elementSearchResultsTitle.textContent = 'Results for: ' + team.strTeam;

/**
 * 
 * @param team 
 */
const renderSearchHistory = team => {
  const teamElement = elementSearchHistoryItems.querySelector('.js-team-' + team.idTeam);
  const timestamp = formatTimestamp(new Date());

  // Check if teams already in search history
  if(teamElement === null) {
    const teamLi = document.createElement('li');
    teamLi.className = 'search-history__item js-team-' + team.idTeam;

    const teamButton = document.createElement('button');
    teamButton.classList.add('search-history__item__text');
    teamButton.textContent = team.strTeam;
    
    // Show the team name as the input placeholder on hover
    teamButton.addEventListener('mouseenter', e => {
      elementSearchField.placeholder = team.strTeam;
    });

    // Restore to default placeholder on mouseleave
    teamButton.addEventListener('mouseleave', e => {
      elementSearchField.placeholder = 'Type your search here';
    });

    // Add click handler for team name to be able to redo search
    teamButton.addEventListener('click', e => {
      elementSearchField.value = team.strTeam;

      const event = new Event('input', {
        'bubbles': true,
        'cancelable': true
      });
      
      // Dispatch event to trigger input when click on team
      elementSearchField.dispatchEvent(event);
    })

    const timestampTime = document.createElement('time');
    timestampTime.className = 'search-history__item__timestamp';
    timestampTime.datetime = timestamp;
    timestampTime.innerHTML = timestamp;
    
    const removeIcon = document.createElement('button');
    removeIcon.className = 'icon-remove';
    
    removeIcon.addEventListener('click', removeSearchHistoryItem)

    teamLi.appendChild(teamButton);
    teamLi.appendChild(timestampTime);
    teamLi.appendChild(removeIcon);

    // Insert the new item first in the history list
    elementSearchHistoryItems.insertBefore(teamLi, elementSearchHistoryItems.firstChild);
    elementSearchHistory.classList.remove('hidden');
  } else {
    // Place search history item first if it's searched for again
    elementSearchHistoryItems.insertBefore(
      teamElement, 
      elementSearchHistoryItems.firstChild
    );
      
    // Update the timestamp
    teamElement.querySelector('.search-history__item__timestamp').innerHTML = timestamp;
  }
}


/**
 * Render message if no results found
 */
const renderNoResults = () => {
  const noResultsLi = document.createElement('li');
  noResultsLi.classList.add('search-result__item', 'search-result__item--no-results');
  noResultsLi.textContent = 'No results found for your search..'

  elementSearchResultsItems.appendChild(noResultsLi);
  
  displayElement(elementSearchResults);
}

/**
 * 
 * @param {object} player - player to render
 */
const renderPlayer = player => {
  const playerLi = document.createElement('li');
  playerLi.classList.add('search-result__item');
  
  const playerArticle = document.createElement('article');
  playerArticle.classList.add('search-result__item__article');

  const playerContent = document.createElement('div');
  playerContent.classList.add('search-result__item__article__content');

  const playerTitle = document.createElement('h1');
  playerTitle.classList.add('search-result__item__article__title');
  playerTitle.textContent = player.strPlayer;
  
  const playerInfo = document.createElement('ul');
  playerInfo.classList.add('search-result__item__article__info');

  const playerImage = document.createElement('img');
  playerImage.classList.add('search-result__item__article__image');
  playerImage.alt = 'Portrait of ' + player.strPlayer;
  playerImage.src = player.strThumb ? player.strThumb : 'img/icons/avatar-player.svg';

  // Renders player info in list
  const renderPlayerInfo = items => {
    for (let key in items) {
      if (items.hasOwnProperty(key)) {
        if (items[key]) {
          const playerInfoLi = document.createElement('li');
          const playerInfoValue = document.createElement('b');
          playerInfoLi.textContent = key + ': ';

          playerInfoValue.textContent = items[key];

          playerInfoLi.appendChild(playerInfoValue);
          playerInfo.appendChild(playerInfoLi);
        }
      }
    }
  }

  renderPlayerInfo({ 
    Number: player.strNumber,
    Nationality: player.strNationality,
    Position: player.strPosition,
    Team: player.strTeam
  });
  
  playerContent.appendChild(playerTitle);
  playerContent.appendChild(playerInfo);
  playerArticle.appendChild(playerContent);
  playerArticle.appendChild(playerImage);
  playerLi.appendChild(playerArticle);

  elementSearchResultsItems.appendChild(playerLi);
  elementSearchResults.classList.contains('hidden') && toggleVisibility(elementSearchResults);
}


/**
 * 
 * @param {object} element - the clicked element 
 */
const onAutocompleteClick = element => {
  // Empty input field on click
  elementSearchField.value = '';

  // Make a search with the selected item
  searchPlayers(element);
  
  // Clear and hide autocomplete
  clearElement(elementAutocomplete);
  hideElement(elementAutocomplete);
  
  // Display the search history
  displayElement(elementSearchHistoryItems);
}

/**
 * 
 * @param {object} team - the team object to fetch players for
 */
const searchPlayers = team => {
  fetchPlayers(team.strTeam)
    .then(data => {
      // Render search history with the team
      renderSearchHistory(team);

      // Replace the search title with the search
      renderSearchTitle(team);

      // Clear the search results before appending new results
      clearElement(elementSearchResultsItems);

      // Check if empty result
      if(data.player) {
        data.player.forEach(player => renderPlayer(player));
      } else {
        renderNoResults();
      }
    })
}


// Call the search function when the user types in the search field
// Debounce prevents the input function to be called more than once every x ms
elementSearchField.addEventListener('input', debounce(e => {
  if(e.target.value) {
    const sanitizedValue = preventFaultyInput(e.target.value);

    // Only search if input passes sanitization
    if(sanitizedValue) {
      fetchTeams(sanitizedValue)
        .then(response => renderAutocomplete(response.teams, sanitizedValue))
        .catch(err => err);
    } else {
      // Render error message if it doesn't pass sanitization
      renderInvalidInput();
    }
  } else {
    // Clear and hide autocomplete if search field is empty
    toggleVisibility(elementAutocomplete);
    clearElement(elementAutocomplete);
  }
}, 250));


/**
 * Eventlistener for clearing the search history
 */
elementSearchHistoryClear.addEventListener('click', () => {
  toggleVisibility(elementSearchHistoryItems);
  clearElement(elementSearchHistoryItems)
})


/**
 * Eventlistener for focusing the input field.
 * Is used to show autocomplete when tabbing to the field.
 */
elementSearchField.addEventListener('focus', () => {
  if (elementSearchField.value !== '') {
    displayElement(elementAutocomplete)
  }
});

/**
 * Eventlistener on body to close autocomplete on clicks outside of it
 */
document.addEventListener('click', event => {
  // If user clicks inside the search do nothing
  if (event.target.closest('.search-box')) {
    return;
  } 
  
	// If user clicks outside autocomplete hide it!
  hideElement(elementAutocomplete);
});


/**
 * Listen to clicks on enter and trigger click on element
 */
document.addEventListener('keyup', event => {
  if(event.keyCode === 13) {
    document.activeElement.click();
  }
});

