from django.shortcuts import render
from django.http import HttpResponse
from django.views.generic.base import TemplateView


class SearchView(TemplateView):
	template_name = "mapper/index.html"

class ResultsView(TemplateView):
	template_name = "mapper/resultsPage.html"
