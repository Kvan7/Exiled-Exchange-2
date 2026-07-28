class UserStyleModel:
    name: str
    description: str
    filename: str
    version: str
    user_style_vars: str
    user_style_default_css: str

    def __init__(
        self,
        name: str,
        description: str,
        filename: str,
        version: str,
        user_style_vars: str,
        user_style_default_css: str,
    ):
        self.name = name
        self.description = description
        self.filename = filename
        self.version = version
        self.user_style_vars = user_style_vars
        self.user_style_default_css = user_style_default_css
