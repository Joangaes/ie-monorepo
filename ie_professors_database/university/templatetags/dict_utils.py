from django import template

register = template.Library()

@register.filter
def get_item(dictionary, key):
    return dictionary.get(key)

@register.filter
def split_by(value, delimiter=","):
    """Splits the string by the given delimiter (default: comma)."""
    return value.split(delimiter)
