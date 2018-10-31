import _cloneDeep from 'lodash/cloneDeep';
import {
  QUERY_RESET_PAGE,
  SET_QUERY_COMPONENT_INITIAL_STATE,
  SET_STATE_FROM_URL,
  SET_QUERY_STRING,
  SET_QUERY_SORT_BY,
  SET_QUERY_SORT_ORDER,
  SET_QUERY_PAGINATION_PAGE,
  SET_QUERY_PAGINATION_SIZE,
  SET_QUERY_AGGREGATION,
  RESULTS_LOADING,
  RESULTS_FETCH_SUCCESS,
  RESULTS_FETCH_ERROR,
  RESULTS_UPDATE_LAYOUT,
} from '@app/state/types';

export const setInitialState = initialState => {
  return dispatch => {
    dispatch({
      type: SET_QUERY_COMPONENT_INITIAL_STATE,
      payload: initialState,
    });
  };
};

export const setQueryFromUrl = (searchDefault, pushState) => {
  return async (dispatch, getState) => {
    let urlParamsApi = getState().urlParamsApi;
    if (urlParamsApi) {
      const queryState = _cloneDeep(getState().query);
      const newStateQuery = urlParamsApi.get(queryState, pushState);
      await dispatch({
        type: SET_STATE_FROM_URL,
        payload: newStateQuery,
      });
    }
    if (searchDefault) {
      dispatch(_executeQuery(false));
    }
  };
};

export const updateQueryString = queryString => {
  return async dispatch => {
    await dispatch({
      type: SET_QUERY_STRING,
      payload: queryString,
    });

    dispatch(_executeQuery());
  };
};

export const updateQuerySortBy = sortByValue => {
  return async dispatch => {
    await dispatch({
      type: SET_QUERY_SORT_BY,
      payload: sortByValue,
    });
    dispatch(_executeQuery());
  };
};

export const updateQuerySortOrder = sortOrderValue => {
  return async dispatch => {
    await dispatch({ type: SET_QUERY_SORT_ORDER, payload: sortOrderValue });
    dispatch(_executeQuery());
  };
};

export const updateQueryPaginationPage = page => {
  return async dispatch => {
    await dispatch({ type: SET_QUERY_PAGINATION_PAGE, payload: page });
    dispatch(_executeQuery(true, false));
  };
};

export const updateQueryPaginationSize = size => {
  return async dispatch => {
    await dispatch({ type: SET_QUERY_PAGINATION_SIZE, payload: size });
    dispatch(_executeQuery());
  };
};

export const updateQueryAggregation = path => {
  return async dispatch => {
    await dispatch({
      type: SET_QUERY_AGGREGATION,
      payload: path,
    });
    dispatch(_executeQuery());
  };
};

export const updateResultsLayout = layout => {
  return dispatch => {
    dispatch({
      type: RESULTS_UPDATE_LAYOUT,
      payload: layout,
    });
  };
};

export const _executeQuery = (
  refreshUrlParams = true,
  resetQueryPage = true
) => {
  return async (dispatch, getState) => {
    let urlParamsApi = getState().urlParamsApi;
    let apiConfig = { ...getState().apiConfig };
    let searchApi = getState().searchApi;

    if (resetQueryPage && getState().query.page != 1) {
      await dispatch({ type: QUERY_RESET_PAGE });
    }

    let queryState = getState().query;
    if (urlParamsApi && refreshUrlParams) {
      urlParamsApi.set(queryState);
    }

    dispatch({ type: RESULTS_LOADING });

    searchApi
      .search(queryState, apiConfig)
      .then(response => {
        let data = searchApi.serialize(response.data);
        dispatch({
          type: RESULTS_FETCH_SUCCESS,
          payload: {
            aggregations: data.aggregations,
            hits: data.hits,
            total: data.total,
          },
        });
      })
      .catch(reason => {
        dispatch({ type: RESULTS_FETCH_ERROR, payload: reason });
      });
  };
};
