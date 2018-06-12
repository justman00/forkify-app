// Global app controller
import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/list';
import Likes from './models/likes';
import * as listView from './views/listView';
import { elements , renderLoader , clearLoader } from './views/base';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as likesView from './views/likesView';
/**
*-search object
*-current recipe object
*-shopping list object
*-liked recipes
 */
const state = {};
//SEARCH CONTROLLER
const controlSearch = async () => {
  // get a query from view
  const query = searchView.getInput();

  if(query) {
    // new search object and add it to state
    state.search = new Search(query);
    //prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);
    try {
      // search for recipes
      await state.search.getResults();

      // render results on UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (err) {
      alert('smth went bad again');
      clearLoader();
    }
  }
}

elements.searchForm.addEventListener('submit',
e=> {
  e.preventDefault();
  controlSearch();
});


elements.searchResPages.addEventListener('click', e => {
  const btn = e.target.closest('.btn-inline');
  if(btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});



//RECIPE CONTROLLER
const controlRecipe = async () => {
  // get ID from url
  const id = window.location.hash.replace('#', '');

   if(id) {
       // prepare the UI for changes
       recipeView.clearRecipe();
       renderLoader(elements.recipe);
       // highlight the selected search item
       if(state.search)
       searchView.highlightSelected(id);

       // create new recipe object
       state.recipe = new Recipe(id);
       try {
         // get recipe data and parse ingredients
         await state.recipe.getRecipe();
         state.recipe.parseIngredients();
         // calculate servings and time
         state.recipe.calcServings();
         state.recipe.calcTime();
         // render the recipe
         clearLoader();
         recipeView.renderRecipe(
           state.recipe,
           state.likes.isLiked(id)
         );
       } catch (err) {
        alert('Error processing Recipe');
    }
   }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


// handling recipe button clicks
elements.recipe.addEventListener('click', e => {
  if(e.target.matches('.btn-decrease, .btn-decrease *')){
    // decrease button is clicked
    if(state.recipe.servings > 1){
        state.recipe.updateServings('dec');
        recipeView.updateServingsIngredients(state.recipe);
    }
  } else if(e.target.matches('.btn-increase, .btn-increase *')){
    // increase button is clicked
    state.recipe.updateServings('inc');
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches('.recipe__btn--add , .recipe__btn--add *')) {
    //add ingridients to shopping list
    controlList();
  } else if(e.target.matches('.recipe__love, .recipe__love *')){
    // like CONTROLLER
    controlLike();
  }
});

const controlList = () => {
  // create a new list if there is none yet
  if(!state.list) state.list = new List();

  // add each ingredient to the least
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

// handle delete and update list item events
elements.shopping.addEventListener('click', el => {
    const id = el.target.closest('.shopping__item').dataset.itemid;

    //handle the delete event
    if(el.target.matches('.shopping__delete, .shopping__delete *')) {
      //delete from state
      state.list.deleteItem(id);
      //delete from UI
      listView.delItem(id);

      //handle the count update
    } else if(el.target.matches('.shopping__count-value')){
      const val = parseFloat(el.target.value);
      state.list.updateCount(id, val);
    }
});


//Like CONTROLLER
const controlLike = () => {
  if(!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;
  //user has not yet liked current recipe
  if(!state.likes.isLiked(currentID)) {
    //add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );
    //toggle the light button
    likesView.toggleLikeBtn(true);
    //add like to the UI list
    likesView.renderLike(newLike);
    //user has yet liked current recipe
  } else {
    //remove like to the state
    state.likes.deleteLike(currentID);
    //toggle the light button
    likesView.toggleLikeBtn(false);
    //remove like to the UI list
    likesView.deleteLike(currentID);
  }

  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// restore liked recipes on page load
window.addEventListener('load', () => {
  state.likes = new Likes();
  // restore likes
  state.likes.readStorage();

  //toggle like menu button
  likesView.toggleLikeMenu(state.likes.getNumLikes());

  //render the existing likes
  state.likes.likes.forEach(like => likesView.renderLike(like));
});
