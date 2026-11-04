FROM mcr.microsoft.com/dotnet/sdk:10.0-noble AS build
WORKDIR /src
COPY Resumade.Api.csproj packages.lock.json ./
RUN dotnet restore --locked-mode
COPY . .
RUN dotnet publish --configuration Release --no-restore --output /publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && curl --fail --silent --show-error --location \
        https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
        --output /tmp/google-chrome.deb \
    && apt-get install -y --no-install-recommends /tmp/google-chrome.deb fonts-liberation fonts-noto-core \
    && rm -rf /var/lib/apt/lists/* /tmp/google-chrome.deb

WORKDIR /app
COPY --from=build /publish .
ENV ASPNETCORE_HTTP_PORTS=8080 \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome \
    Pdf__MaxConcurrentRenders=1
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "Resumade.Api.dll"]
