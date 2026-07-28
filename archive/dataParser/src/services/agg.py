from typing import Any, Callable

import pandas as pd


def make_list_agg(
    columns_to_list: list[str] | None = None,
    columns_to_set: list[str] | None = None,
    columns_to_csv: list[str] | None = None,
) -> Callable[..., list[Any] | Any]:  # pyright: ignore[reportExplicitAny]
    """
    Creates a function for the purpose of passing to `df.agg` after grouping the dataframe with
    `df.groupby` which will automatically select aggregation functions for specific columns,
    and select the first for all unselected columns.

    Parameters
    ----------
    columns_to_list : list[str] | None, optional
        Columns will be aggregated via passing into a list, by default None
    columns_to_set : list[str] | None, optional
        Columns to be aggregated via passing into a set, by default None
    columns_to_csv : list[str] | None, optional
        Columns to be aggregated via creating a csv string, by default None

    Returns
    -------
    Callable[..., list[Any] | Any]
        Function to pass to df.agg

    Examples
    --------
    Call directly in the `df.agg` method, since this returns the function itself

    >>> import pandas as pd
    >>> example_df = pd.DataFrame({'a': [1, 1, 2, 2], 'b': [3, 4, 5, 6]})
    >>> example_df.groupby('a').agg(make_list_agg(columns_to_list=['b']))
        b
    a
    1  [3, 4]
    2  [5, 6]

    >>> import pandas as pd
    >>> example_df = pd.DataFrame({'a': [1, 1, 2, 2], 'b': [3, 4, 5, 6]})
    >>> example_df.groupby('a').agg(make_list_agg())
        b
    a
    1	3
    2	5
    """

    def custom_agg(col: pd.Series) -> list[Any] | Any:  # pyright: ignore[reportExplicitAny, reportMissingTypeArgument]
        col_name = col.name
        if columns_to_list is not None and col_name in columns_to_list:
            return list(col.dropna())
        if columns_to_set is not None and col_name in columns_to_set:
            return set(col.dropna())
        if columns_to_csv is not None and col_name in columns_to_csv:
            return ",".join(col.dropna())
        return col.iloc[0]  # pyright: ignore[reportAny]

    return custom_agg
